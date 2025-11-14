// @ts-ignore
import crx3 from "crx3";

console.log(process.cwd());

await crx3([`${process.cwd()}/.output/chrome-mv3/manifest.json`], {
	keyPath: `${process.cwd()}/.secret/chrome-web-store.pem`,
	crxPath: `${process.cwd()}/.output/chrome-mv3.crx`,
})
	.then(() => console.log("done"))
	.catch(console.error);
