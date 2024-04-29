export function resolveImport(importerFilePath: string, importFilePath: string) {
	const splitImporterFilePath = importerFilePath.split("/").slice(0, -1);
	const splitImportFilePath = importFilePath.split("/").slice(0, -1);
	const targetFile = importFilePath.split("/")[splitImportFilePath.length].replace(".ts", ".js");

	let i: number;
	for (i = 0; i < splitImporterFilePath.length; i++) {
		if (splitImporterFilePath[i] !== splitImportFilePath[i]) {
			break;
		}
	}

	const doubleDotPart = "../".repeat(splitImporterFilePath.length - i);
	const dotPart = doubleDotPart.length === 0 ? "./" : doubleDotPart;

	const importCountDifference = i - splitImportFilePath.length;

	const missingPart = importCountDifference !== 0
		? splitImportFilePath.slice(importCountDifference, splitImportFilePath.length).join("/") + "/"
		: "";

	const out = dotPart + missingPart + targetFile;
	return out;
}

// Simple test
// resolveImport("./in/school/prova/1.ts", "./in/test/2.ts");
