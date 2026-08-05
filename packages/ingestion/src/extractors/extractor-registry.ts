import { ExtractorPlugin, SourceProfile } from '../types';
import { RssPlugin } from './plugins/rss.plugin';
import { ApiPlugin } from './plugins/api.plugin';
import { HtmlPlugin } from './plugins/html.plugin';
import { HtmlCardPlugin } from './plugins/html-card.plugin';

export class ExtractorRegistry {
  private static plugins: Map<string, ExtractorPlugin> = new Map();

  static {
    // Register Default System Plugins
    this.register(new RssPlugin());
    this.register(new ApiPlugin());
    this.register(new HtmlCardPlugin());
    this.register(new HtmlPlugin());
  }

  public static register(plugin: ExtractorPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  public static getPlugin(profile: SourceProfile): ExtractorPlugin {
    // 1. Direct plugin name lookup
    if (profile.extractorPlugin && this.plugins.has(profile.extractorPlugin)) {
      return this.plugins.get(profile.extractorPlugin)!;
    }

    // 2. Strategy capability check
    for (const plugin of this.plugins.values()) {
      if (plugin.canHandle(profile)) {
        return plugin;
      }
    }

    // 3. Default fallback to HtmlCardPlugin
    return this.plugins.get('HtmlCardPlugin')!;
  }
}