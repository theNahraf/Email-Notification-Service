import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import { getLogger } from 'shared';

const logger = getLogger('template-engine');

/**
 * Handlebars template engine for rendering dynamic emails.
 * Templates are loaded from the templates directory and compiled on first use.
 */
export class TemplateEngine {
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private templatesDir: string;

  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || path.join(__dirname, '../templates');
    this.registerHelpers();
    logger.info({ templatesDir: this.templatesDir }, 'Template engine initialized');
  }

  /**
   * Render a template with the given data.
   * @param templateId - Name of the template file (without .hbs extension)
   * @param data - Data to inject into the template
   * @returns Rendered HTML string
   */
  render(templateId: string, data: Record<string, any>): string {
    const compiled = this.getCompiledTemplate(templateId);

    // Inject common template data
    const enrichedData = {
      ...data,
      year: new Date().getFullYear(),
      serviceName: 'Notification Service',
    };

    return compiled(enrichedData);
  }

  /**
   * Check if a template exists.
   */
  hasTemplate(templateId: string): boolean {
    const templatePath = path.join(this.templatesDir, `${templateId}.hbs`);
    return fs.existsSync(templatePath);
  }

  /**
   * Get all available template IDs.
   */
  getAvailableTemplates(): string[] {
    try {
      return fs
        .readdirSync(this.templatesDir)
        .filter((f) => f.endsWith('.hbs'))
        .map((f) => f.replace('.hbs', ''));
    } catch {
      return [];
    }
  }

  /**
   * Get or compile a template. Caches compiled templates for performance.
   */
  private getCompiledTemplate(templateId: string): HandlebarsTemplateDelegate {
    if (this.compiledTemplates.has(templateId)) {
      return this.compiledTemplates.get(templateId)!;
    }

    const templatePath = path.join(this.templatesDir, `${templateId}.hbs`);

    if (!fs.existsSync(templatePath)) {
      logger.error({ templateId, templatePath }, 'Template not found');
      throw new Error(`Template not found: ${templateId}`);
    }

    const source = fs.readFileSync(templatePath, 'utf-8');
    const compiled = Handlebars.compile(source);
    this.compiledTemplates.set(templateId, compiled);

    logger.debug({ templateId }, 'Template compiled and cached');
    return compiled;
  }

  /**
   * Register custom Handlebars helpers.
   */
  private registerHelpers(): void {
    Handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    Handlebars.registerHelper('formatDate', (date: string | Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    Handlebars.registerHelper('ifEquals', function (this: any, a: any, b: any, options: any) {
      return a === b ? options.fn(this) : options.inverse(this);
    });
  }
}
