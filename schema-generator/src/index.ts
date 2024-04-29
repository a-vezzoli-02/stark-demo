import { mkdir, readFileSync, writeFile } from "fs";
import { dirname } from "path";
import { walk } from "walk";
import { TableColumn, TableSchema } from "./types.js";
import { resolveImport } from "./importResolution.js";

type Context = {
	inPath: string;
	outPath: string;
	tableSchema: TableSchema;
};

type ContextMap = {
	[key: string]: Context;
};

async function main() {
	const walker = walk('./in', { followLinks: false });

	const contextList: Context[] = [];

	walker.on('file', function(root: any, stat: any, next: any) {
		const inFilePath = root + '/' + stat.name;
		const outFilePath = inFilePath.replace("in", "out").replace(".json", ".ts");

		const data = readFileSync(inFilePath, 'utf8');
		const tableSchema = JSON.parse(data) as TableSchema;

		contextList.push({
			inPath: inFilePath,
			outPath: outFilePath,
			tableSchema: tableSchema,
		});

		next();
	});


	walker.on('end', function() {
		const contextMap = buildContextMap(contextList);

		contextList.forEach(context => {
			const generatedSchema = buildTable(context.tableSchema, contextMap);

			writeToFile(context.outPath, generatedSchema);
		});
	});
}

function buildContextMap(contextList: Context[]): ContextMap {
	const contextMap: ContextMap = contextList.reduce((a, c) => ({ ...a, [c.tableSchema.properties.name]: c }), {});
	return contextMap;
}

function writeToFile(path: string, content: string) {
	const outDir = dirname(path);

	mkdir(outDir, { recursive: true }, (err) => {
		if (err) throw err;

		writeFile(path, content, function(err) {
			if (err) throw err;
		});
	});
}

function buildTable(tableSchema: TableSchema, contextMap: ContextMap) {
	const tableName: string = tableSchema.properties.tableName ? `@Table({ tableName: '${tableSchema.properties.tableName}' })` : "@Table";

	const columns = tableSchema.properties.columns.map(buildColumnString).join("\n");

	const dependecies = tableSchema.properties.columns
		.map(x => x.relation)
		.filter(x => x != undefined)
		.map(relation => {
			// compiler complains it could be undefined, which it can't
			const castedRelation = relation as string;
			const importPath = resolveImport(contextMap[tableSchema.properties.name].outPath, contextMap[castedRelation].outPath);

			return `import { ${relation} } from "${importPath}"`;
		})
		.join("\n");

	return `import { Table, Column, Model, BelongsTo, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
${dependecies}

${tableName}
export class ${tableSchema.properties.name} extends Model {
${columns}
}`;
}

function buildColumnString(column: TableColumn) {
	const field = column.columName ? `field: '${column.columName}'` : "";
	const type = `type: DataType.${column.columnType}`;
	const columAttributes = [field, type].filter(x => x.length > 0).join(",");
	const columnAnnotation = `@Column({${columAttributes}})`;

	const primaryKeyAnnotation = column.isPrimary === true ? "@PrimaryKey" : "";
	const autoIncrementAnnotaion = column.isPrimary === true ? "@AutoIncrement" : "";
	const belongsToAnnotation = column.relation !== undefined ? `@BelongsTo(() => ${column.relation})` : "";

	const annotations = [columnAnnotation, primaryKeyAnnotation, autoIncrementAnnotaion, belongsToAnnotation].filter(x => x.length > 0).join("\n\t");

	const nullType = column.isPrimary === true ? " | null" : "";

	return `	${annotations}
	${column.name}: ${column.type}${nullType};
`;
}

main();
