export function bodyClass(className) {
	return {
		enable: () => {
			document.body.classList.add(className);
		},
		disable: () => {
			document.body.classList.remove(className);
		},
	};
}
