import { Location, Range, ReferenceParams } from 'vscode-languageserver';
import { documents, getWordRangeAtPosition, parser } from '.';
import Linter from '../language/linter';
import { calculateOffset } from './linter';

import * as Project from "./project";

export async function referenceProvider(params: ReferenceParams): Promise<Location[]|undefined> {
	const uri = params.textDocument.uri;
	const position = params.position;
	const document = documents.get(uri);

	if (document) {
		const isFree = (document.getText(Range.create(0, 0, 0, 6)).toUpperCase() === `**FREE`);

		const word = getWordRangeAtPosition(document, position);

		if (word) {
			const doc = await parser.getDocs(uri, document.getText());

			if (doc) {
				if (isFree) {
					Linter.getErrors(
						{
							uri,
							content: document.getText()
						},
						{
							CollectReferences: true
						},
						doc
					);
				}

				const def = doc.findDefinition(position.line, word);

				if (def) {
					if (Project.isEnabled) {
						return Project.findAllReferences(def);
					} else {
						return def.references.map(ref => Location.create(
							def.position.path,
							calculateOffset(document, ref)
						));	
					}
				}
			}
		}
	}

	return;
}