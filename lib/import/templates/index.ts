/**
 * Import JSON example templates for admin dialogs
 */
import examTemplate from "./exam-template.json"
import taxonomyTemplate from "./taxonomy-template.json"
import questionTemplate from "./question-template.json"
import campusTemplate from "./campus-template.json"

export const examTemplateJson = JSON.stringify(examTemplate, null, 2)
export const taxonomyTemplateJson = JSON.stringify(taxonomyTemplate, null, 2)
export const questionTemplateJson = JSON.stringify(questionTemplate, null, 2)
export const campusTemplateJson = JSON.stringify(campusTemplate, null, 2)
