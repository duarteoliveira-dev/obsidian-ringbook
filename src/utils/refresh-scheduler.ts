export function createScheduler(fn: () => void): () => void {
	let pending = false;
	return () => {
		if (pending) return;
		pending = true;
		window.requestAnimationFrame(() => {
			pending = false;
			fn();
		});
	};
}
