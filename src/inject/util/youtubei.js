export async function youtubeiAPIv1(path, args, hl = "en", gl = "US") {
	return await (
		await fetch(`https://www.youtube.com/youtubei/v1${path}?prettyPrint=false`, {
			headers: {
				accept: "*/*",
				"content-type": "application/json",
			},
			body: JSON.stringify({
				context: {
					client: {
						clientName: "WEB",
						clientVersion: "2.20250523.01.00",
						gl: gl,
						hl: hl,
					},
				},
				...args,
			}),
			method: "POST",
		})
	).json();
}
