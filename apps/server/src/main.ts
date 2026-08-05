import {
  Downloader,
  ExtractorRegistry,
  Normalizer,
  ChangeDetector,
  ProfileManager,
  DetectionPipeline,
} from '@market-sentinel/ingestion';

const downloader = new Downloader({ timeoutMs: 10000, maxRetries: 3 });
const profileManager = new ProfileManager(prisma);
const changeDetector = new ChangeDetector(prisma);
const detectionPipeline = new DetectionPipeline();

// --- V3 INGESTION ENGINE PIPELINE ---
async function processAndIngestSourceV3(source: any, triggerMode: 'AUTO' | 'MANUAL' = 'AUTO') {
  console.log(`🔍 [${triggerMode} FETCH V3] Ingestion started for: ${source.name} (${source.url})`);

  // 1. Fetch or initialize SourceProfile
  let profile = await profileManager.getProfile(source.id);
  if (!profile) {
    const plan = await detectionPipeline.detect(source.url);
    profile = await profileManager.saveProfile(source.id, plan);
  }

  // 2. Downloader Pipeline (HTTP, Retry, Backoff)
  let payload;
  try {
    payload = await downloader.download(source.url);
    await profileManager.updateHealth(source.id, true);
  } catch (downloadErr: any) {
    console.error(`⚠️ [Downloader Error V3] ${source.name}: ${downloadErr.message || downloadErr}`);
    await profileManager.updateHealth(source.id, false);
    return 0;
  }

  // 3. Extractor Pipeline (Plugin Architecture)
  const plugin = ExtractorRegistry.getPlugin(profile);
  console.log(`🔌 [Plugin Active] Using "${plugin.name}" for ${source.name}`);
  const rawItems = await plugin.extract(payload, profile);

  // 4. Normalization Pipeline (ExtractedItem ➔ NormalizedEvent)
  const normalizedEvents = rawItems.map(item =>
    Normalizer.normalize(item, source.name, profile!)
  );

  // 5. Change Detection Pipeline (Smart Content Hashing & Event Diffing)
  const { newEvents, skippedDuplicatesCount } = await changeDetector.detectChanges(source.id, normalizedEvents);

  if (skippedDuplicatesCount > 0) {
    console.log(`ℹ️ [DEDUP FILTER V3] Skipped ${skippedDuplicatesCount} duplicate items for ${source.name}`);
  }

  // 6. Ingestion & Notification Dispatch
  let ingestedCount = 0;
  for (const event of newEvents) {
    try {
      await prisma.event.create({
        data: {
          sourceId: source.id,
          categoryId: source.categoryId,
          title: event.title,
          description: event.summary,
          originalContent: event.rawContent,
          directLink: event.url,
          contentHash: event.contentHash,
          publishedAt: event.publishedAt,
        },
      });

      ingestedCount++;

      // Dispatch Notifications
      const telegramHtml = `
📰 <b>${event.title}</b>
<i>Source: ${source.name} (${triggerMode} CHECK - V3)</i>

📝 <b>Preview:</b>
${event.summary}

🔗 <a href="${event.url}">Read Specific Article / Event ↗</a>
      `;

      const emailHtml = `
        <p><strong>${event.title}</strong></p>
        <p><em>Source: ${source.name} (${triggerMode} CHECK - V3)</em></p>
        <p><strong>Preview:</strong> ${event.summary}</p>
        <p><a href="${event.url}" style="color: #38bdf8; font-weight: bold;">🔗 Read Specific Article / Event ↗</a></p>
      `;

      await sendTelegramNotification(telegramHtml);
      await sendEmailNotification(`Market Sentinel Alert: ${event.title}`, emailHtml);
    } catch (dbErr: any) {
      if (dbErr?.code === 'P2002') {
        console.log(`ℹ️ [DEDUP FILTER V3] Skipped duplicate database record for ${source.name}`);
      } else {
        console.error(`❌ [Database Error V3]:`, dbErr.message || dbErr);
      }
    }
  }

  // 0 New Events Status Check Alert
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (ingestedCount === 0 && (settings as any)?.notifyWhenEmpty) {
    const emptyMsg = `Status Check Complete for source "${source.name}" (${triggerMode} CHECK - V3). Result: 0 new events.`;
    await sendTelegramNotification(`🔔 <b>Market Sentinel Status Alert (${triggerMode})</b>\nSource: <b>${source.name}</b>\nResult: 0 new events detected.`);
    await sendEmailNotification(`Market Sentinel Status (${triggerMode}): ${source.name}`, emptyMsg);
  }

  console.log(`📊 [INGESTION STATS V3] ${source.name} | Mode: ${triggerMode} | Ingested: ${ingestedCount} | Skipped Duplicates: ${skippedDuplicatesCount}`);
  return ingestedCount;
}

// --- ADD THIS REST API ENDPOINT UNDER REST API SECTION ---
app.get('/api/sources/:id/health', async (req, res) => {
  try {
    const { id } = req.params;
    const metrics = await healthMonitor.calculateHealthMetrics(id);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch source health telemetry' });
  }
});
