import { readFile } from "node:fs/promises";

const REMOVAL_THRESHOLD = 0.15; // 15% threshold

function countEntries(index) {
	let count = 0;
	Object.values(index).forEach((os) => {
		Object.values(os).forEach((arch) => {
			Object.values(arch).forEach((jdk) => {
				count += Object.keys(jdk).length;
			});
		});
	});
	return count;
}

async function validateIndex() {
	const oldIndex = JSON.parse(await readFile("old-index.json", "utf8"));
	const newIndex = JSON.parse(await readFile("index.json", "utf8"));

	const oldCount = countEntries(oldIndex);
	const newCount = countEntries(newIndex);
	const diff = oldCount - newCount;
	const percentChange = diff / oldCount;

	console.log(`Old index entries: ${oldCount}`);
	console.log(`New index entries: ${newCount}`);
	console.log(`Difference: ${diff} (${(percentChange * 100).toFixed(2)}%)`);

	if (percentChange > REMOVAL_THRESHOLD) {
		console.error(
			`❌ VALIDATION FAILED: ${(percentChange * 100).toFixed(2)}% of entries removed (threshold: ${REMOVAL_THRESHOLD * 100}%)`,
		);
		process.exit(1);
	}

	if (percentChange > 0.05) {
		console.warn(
			`⚠️  WARNING: ${(percentChange * 100).toFixed(2)}% of entries removed`,
		);
	}

	console.log("✅ Validation passed");
}

validateIndex();
