import { generateHelp } from '../definitions/generators/help-generator.js';

export function displayHelpText() {
  console.log(generateHelp());
}
