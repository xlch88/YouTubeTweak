export type Plugin = {
	setup?: Function;
	enable?: Function;
	disable?: Function;

	initPlayer?: Function;
	initComments?: (el: HTMLDivElement, setUpdateListener: (callback: (mutations: MutationRecord[]) => void) => void) => void;
	configUpdate?: (oldConfig: any, newConfig: any) => boolean;
	videoSrcChange?: (oldValue: string | null, newValue: string | null) => void;

	options?: {
		reloadOnToggle?: boolean;
	};
};

// Extend the Window interface to include the yt property
declare global {
	interface Window {
		yt?: any;
		ytplayer?: any;
	}
}
