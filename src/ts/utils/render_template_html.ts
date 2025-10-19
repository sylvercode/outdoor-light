/**
 * Renders an HTML template with the provided data and returns the first element.
 * @param templatePath The path to the HTML template.
 * @param data The data to be used in the template.
 * @returns A promise that resolves to the first element of the rendered template.
 */
export async function renderTemplateHtml<T extends Element>(templatePath: string, data: any): Promise<T> {
    const template = await foundry.applications.handlebars.renderTemplate(templatePath, data);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = template.trim();
    return wrapper.firstElementChild as T;
}
