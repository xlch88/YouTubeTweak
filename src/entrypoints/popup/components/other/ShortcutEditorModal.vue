<template>
	<Teleport to="body">
		<transition name="sc-modal-fade">
			<div v-if="open" class="sc-modal-backdrop" @click.self="handleBackdropClick">
				<div class="sc-modal-dialog" role="dialog" aria-modal="true">
					<!-- Main editor view -->
					<template v-if="view === 'main'">
						<div class="sc-modal-top">
							<span class="sc-modal-title">{{ title }}</span>
							<button
								type="button"
								class="sc-modal-close"
								:aria-label="$t('other.shortcuts.button.cancel')"
								@click="emit('close')"
							>
								×
							</button>
						</div>

						<div class="sc-modal-body">
							<div class="field-section">
								<span class="field-label">{{ $t("other.shortcuts.editor.keyLabel") }}</span>
								<div class="capture-stage" :class="{ recording: isRecording, filled: !!draft.key }">
									<button ref="recorderButton" type="button" class="capture-surface" @click="toggleRecording">
										<template v-if="isRecording">
											<span class="pulse-ring"></span>
											<span class="capture-live-text">{{ $t("other.shortcuts.editor.pressKey") }}</span>
										</template>
										<template v-else-if="draftKeyParts.length">
											<span class="keycaps keycap-pop" :key="draft.key">
												<template v-for="(part, index) in draftKeyParts" :key="`${part}-${index}`">
													<span v-if="index > 0" class="keycap-sep">+</span>
													<kbd>{{ part }}</kbd>
												</template>
											</span>
										</template>
										<template v-else>
											<span class="ghost-keycap">?</span>
											<span class="capture-idle-text">{{ $t("other.shortcuts.editor.clickToRecord") }}</span>
										</template>
									</button>
									<button
										v-if="draft.key && !isRecording"
										type="button"
										class="capture-clear"
										:title="$t('other.shortcuts.editor.clearKey')"
										:aria-label="$t('other.shortcuts.editor.clearKey')"
										@click="clearDraftKey"
									>
										×
									</button>
								</div>

								<div v-if="conflictAction" class="notice-strip is-conflict">
									{{
										$t("other.shortcuts.notice.duplicate", {
											action: $t(`other.shortcuts.actions.${conflictAction}`),
										})
									}}
								</div>
								<div v-if="nativeKeyName" class="notice-strip is-native">
									{{
										$t("other.shortcuts.notice.nativeOverlap", {
											native: $t(`other.shortcuts.native.${nativeKeyName}`),
										})
									}}
								</div>
							</div>

							<div class="field-section">
								<span class="field-label">{{ $t("other.shortcuts.editor.actionLabel") }}</span>
								<button type="button" class="action-trigger" @click="openPickerView">
									<span class="action-trigger-icon" aria-hidden="true">
										<svg viewBox="0 0 16 16" fill="none">
											<path
												:d="SHORTCUT_ACTION_ICONS[draft.action]"
												stroke="currentColor"
												stroke-width="1.45"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</span>
									<span class="action-trigger-meta">
										<span class="action-trigger-group">{{ $t(`other.shortcuts.groups.${draftActionGroup}`) }}</span>
										<span class="action-trigger-text">{{ $t(`other.shortcuts.actions.${draft.action}`) }}</span>
									</span>
									<span class="action-trigger-chevron" aria-hidden="true">›</span>
								</button>
							</div>

							<div v-if="activeParam" class="field-section">
								<div class="param-block">
									<div class="param-head">
										<span class="param-label">{{ $t(`other.shortcuts.param.${activeParam.kind}`) }}</span>
										<div v-if="activeParam.kind !== 'quality' && draft.value !== 'buttons'" class="unit-input">
											<input
												type="number"
												:min="activeParam.min"
												:max="activeParam.max"
												:step="activeParam.step"
												v-model.number="draftNumericValue"
											/>
											<span>{{ paramUnit }}</span>
										</div>
									</div>

									<div v-if="activeParam.kind === 'quality'" class="quality-grid">
										<button
											v-for="option in SHORTCUT_QUALITY_OPTIONS"
											:key="option.value"
											type="button"
											class="param-pill"
											:class="{ active: draft.value === option.value }"
											@click="draft.value = option.value"
										>
											{{
												option.value === "auto"
													? $t("other.shortcuts.param.qualityAuto")
													: option.label.replace(/\s*\(.*?\)/, "")
											}}
										</button>
									</div>

									<div v-else class="param-pills">
										<button
											v-if="activeParam.kind === 'speedStep'"
											type="button"
											class="param-pill"
											:class="{ active: draft.value === 'buttons' }"
											@click="draft.value = 'buttons'"
										>
											{{ $t("other.shortcuts.param.followSpeedButtons") }}
										</button>
										<button
											v-for="preset in activeParam.presets"
											:key="preset"
											type="button"
											class="param-pill"
											:class="{ active: draft.value !== 'buttons' && Number(draft.value) === preset }"
											@click="draft.value = preset"
										>
											{{ formatQuickChip(activeParam.kind, preset) }}
										</button>
									</div>
								</div>
							</div>
						</div>

						<div class="sc-modal-footer">
							<button v-if="canDelete" type="button" class="danger-ghost-btn" @click="emit('delete')">
								{{ $t("other.shortcuts.editor.delete") }}
							</button>
							<div class="footer-right">
								<button type="button" class="ghost-btn" @click="emit('close')">
									{{ $t("other.shortcuts.button.cancel") }}
								</button>
								<button type="button" class="commit-btn" :disabled="!draft.key" @click="handleSubmit">
									{{ submitLabel }}
								</button>
							</div>
						</div>
					</template>

					<!-- Full-height action picker view -->
					<template v-else>
						<div class="sc-modal-top">
							<button
								type="button"
								class="sc-modal-back"
								:aria-label="$t('other.shortcuts.editor.back')"
								@click="view = 'main'"
							>
								‹
							</button>
							<span class="sc-modal-title">{{ $t("other.shortcuts.editor.selectActionTitle") }}</span>
							<button
								type="button"
								class="sc-modal-close"
								:aria-label="$t('other.shortcuts.button.cancel')"
								@click="emit('close')"
							>
								×
							</button>
						</div>

						<div class="picker-toolbar">
							<div class="picker-search">
								<input
									ref="searchInput"
									v-model="actionSearch"
									type="text"
									:placeholder="$t('other.shortcuts.editor.searchPlaceholder')"
								/>
								<button v-if="actionSearch" type="button" class="search-clear" @click="actionSearch = ''">×</button>
							</div>

							<div class="picker-tabs">
								<button
									type="button"
									class="picker-tab"
									:class="{ active: activeGroupFilter === 'all' }"
									@click="activeGroupFilter = 'all'"
								>
									{{ $t("other.shortcuts.groups.all") }}
								</button>
								<button
									v-for="groupId in SHORTCUT_GROUP_ORDER"
									:key="groupId"
									type="button"
									class="picker-tab"
									:class="{ active: activeGroupFilter === groupId }"
									@click="activeGroupFilter = groupId"
								>
									{{ $t(`other.shortcuts.groups.${groupId}`) }}
								</button>
							</div>
						</div>

						<div class="picker-list">
							<template v-if="groupedFilteredActions.length">
								<div v-for="group in groupedFilteredActions" :key="group.id" class="picker-group">
									<div v-if="activeGroupFilter === 'all'" class="picker-group-header">
										<span>{{ $t(`other.shortcuts.groups.${group.id}`) }}</span>
										<span class="group-count">{{ group.actions.length }}</span>
									</div>
									<div class="picker-group-items">
										<button
											v-for="option in group.actions"
											:key="option.id"
											type="button"
											class="picker-option"
											:class="{ selected: draft.action === option.id }"
											@click="selectDraftAction(option.id)"
										>
											<svg class="option-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
												<path
													:d="SHORTCUT_ACTION_ICONS[option.id]"
													stroke="currentColor"
													stroke-width="1.45"
													stroke-linecap="round"
													stroke-linejoin="round"
												/>
											</svg>
											<span class="option-label">{{ $t(`other.shortcuts.actions.${option.id}`) }}</span>
											<span v-if="formatOptionParamTag(option)" class="option-tag">
												{{ formatOptionParamTag(option) }}
											</span>
											<span v-if="draft.action === option.id" class="option-check" aria-hidden="true">✓</span>
										</button>
									</div>
								</div>
							</template>
							<div v-else class="picker-empty">{{ $t("other.shortcuts.editor.noMatch") }}</div>
						</div>
					</template>
				</div>
			</div>
		</transition>
	</Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { SHORTCUT_ACTION_ICONS } from "../../util/shortcutIcons";
import {
	SHORTCUT_ACTION_DEFINITIONS,
	SHORTCUT_ACTION_MAP,
	SHORTCUT_GROUP_ORDER,
	SHORTCUT_QUALITY_OPTIONS,
	YOUTUBE_NATIVE_SHORTCUTS,
	captureShortcutFromEvent,
	formatShortcutParts,
	getDefaultShortcutValue,
	normalizeShortcutValue,
	type ShortcutAction,
	type ShortcutActionDefinition,
	type ShortcutGroupId,
} from "@/util/shortcuts";

const props = withDefaults(
	defineProps<{
		open: boolean;
		title: string;
		submitLabel: string;
		canDelete?: boolean;
		initialKey?: string;
		initialAction?: ShortcutAction;
		initialValue?: number | string;
		autoRecord?: boolean;
		findConflictAction?: (key: string) => ShortcutAction | null;
	}>(),
	{
		canDelete: false,
		initialKey: "",
		initialAction: "speed.toggle",
		autoRecord: false,
	},
);

const emit = defineEmits<{
	save: [payload: { key: string; action: ShortcutAction; value?: number | string }];
	delete: [];
	close: [];
}>();

const { t } = useI18n();

const view = ref<"main" | "picker">("main");
const isRecording = ref(false);
const actionSearch = ref("");
const activeGroupFilter = ref<"all" | ShortcutGroupId>("all");
const recorderButton = ref<HTMLButtonElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);

const draft = reactive<{
	key: string;
	action: ShortcutAction;
	value: number | string | undefined;
}>({
	key: "",
	action: "speed.toggle",
	value: getDefaultShortcutValue("speed.toggle"),
});

const activeParam = computed(() => SHORTCUT_ACTION_MAP[draft.action]?.param);
const draftActionGroup = computed(() => SHORTCUT_ACTION_MAP[draft.action]?.group ?? "speed");
const draftKeyParts = computed(() => formatShortcutParts(draft.key));
const conflictAction = computed(() => (draft.key ? props.findConflictAction?.(draft.key) ?? null : null));
const nativeKeyName = computed(() => (draft.key ? YOUTUBE_NATIVE_SHORTCUTS[draft.key] || "" : ""));

const groupedFilteredActions = computed(() => {
	const keyword = actionSearch.value.trim().toLowerCase();
	return SHORTCUT_GROUP_ORDER.filter((groupId) => activeGroupFilter.value === "all" || activeGroupFilter.value === groupId)
		.map((groupId) => ({
			id: groupId,
			actions: SHORTCUT_ACTION_DEFINITIONS.filter((def) => {
				if (def.group !== groupId) return false;
				if (!keyword) return true;
				const label = t(`other.shortcuts.actions.${def.id}`).toLowerCase();
				const groupLabel = t(`other.shortcuts.groups.${def.group}`).toLowerCase();
				return label.includes(keyword) || groupLabel.includes(keyword) || def.id.toLowerCase().includes(keyword);
			}),
		}))
		.filter((group) => group.actions.length > 0);
});

const draftNumericValue = computed<number | string>({
	get() {
		if (typeof draft.value === "number" || draft.value === "") return draft.value;
		return Number(activeParam.value?.defaultValue ?? 1);
	},
	set(nextValue) {
		if (nextValue === "") {
			draft.value = "";
			return;
		}
		if (typeof nextValue === "number" && Number.isFinite(nextValue)) {
			draft.value = nextValue;
		}
	},
});

const paramUnit = computed(() => {
	const kind = activeParam.value?.kind;
	if (kind === "speed" || kind === "speedStep") return "×";
	if (kind === "seconds") return "s";
	if (kind === "volume") return "%";
	return "";
});

function formatOptionParamTag(option: ShortcutActionDefinition) {
	if (!option.param) return "";
	switch (option.param.kind) {
		case "speedStep":
			return "±×";
		case "speed":
			return "×";
		case "seconds":
			return "s";
		case "volume":
			return "%";
		case "quality":
			return "HD";
	}
}

function stopRecording() {
	if (!isRecording.value) return;
	isRecording.value = false;
	window.removeEventListener("keydown", handleRecordKeyDown, true);
	window.removeEventListener("pointerdown", handleRecordPointerDown, true);
}

function startRecording() {
	if (isRecording.value || view.value !== "main") return;
	isRecording.value = true;
	window.addEventListener("keydown", handleRecordKeyDown, true);
	window.addEventListener("pointerdown", handleRecordPointerDown, true);
}

function toggleRecording() {
	if (isRecording.value) stopRecording();
	else startRecording();
}

function handleRecordKeyDown(event: KeyboardEvent) {
	event.preventDefault();
	event.stopPropagation();

	if (event.code === "Escape" && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
		stopRecording();
		return;
	}

	const captured = captureShortcutFromEvent(event);
	if (!captured) return;
	draft.key = captured;
	stopRecording();
}

function handleRecordPointerDown(event: PointerEvent) {
	if (recorderButton.value && event.target instanceof Node && recorderButton.value.contains(event.target)) return;
	stopRecording();
}

function handleModalEscape(event: KeyboardEvent) {
	if (!props.open || isRecording.value || event.key !== "Escape") return;
	event.preventDefault();
	if (view.value === "picker") {
		view.value = "main";
	} else {
		emit("close");
	}
}

function handleBackdropClick() {
	if (isRecording.value) {
		stopRecording();
		return;
	}
	emit("close");
}

function clearDraftKey() {
	draft.key = "";
	stopRecording();
}

async function openPickerView() {
	stopRecording();
	actionSearch.value = "";
	activeGroupFilter.value = "all";
	view.value = "picker";
	await nextTick();
	searchInput.value?.focus();
}

function selectDraftAction(action: ShortcutAction) {
	if (draft.action !== action) {
		draft.action = action;
		draft.value = getDefaultShortcutValue(action);
	}
	view.value = "main";
}

function formatQuickChip(kind: string, value: number) {
	if (kind === "speed" || kind === "speedStep") return `${value}×`;
	if (kind === "seconds") return `${value}s`;
	if (kind === "volume") return `${value}%`;
	return String(value);
}

function handleSubmit() {
	if (!draft.key) return;
	stopRecording();
	const value = normalizeShortcutValue(draft.action, draft.value);
	emit("save", {
		key: draft.key,
		action: draft.action,
		...(value !== undefined ? { value } : {}),
	});
}

watch(
	() => props.open,
	async (isOpen) => {
		if (!isOpen) {
			stopRecording();
			window.removeEventListener("keydown", handleModalEscape);
			return;
		}

		view.value = "main";
		draft.key = props.initialKey;
		draft.action = props.initialAction;
		draft.value = props.initialValue ?? getDefaultShortcutValue(props.initialAction);
		window.addEventListener("keydown", handleModalEscape);

		await nextTick();
		recorderButton.value?.focus();
		if (props.autoRecord) startRecording();
	},
);

onBeforeUnmount(() => {
	stopRecording();
	window.removeEventListener("keydown", handleModalEscape);
});
</script>

<style lang="scss" scoped>
.sc-modal-backdrop {
	--sc-ink: #1c1f2e;
	--sc-muted: #6e7387;
	--sc-subtle: #979cad;
	--sc-accent: #7c3aed;
	--sc-accent-hover: #6d28d9;
	--sc-accent-soft: #f3eeff;
	--sc-accent-border: #d8c8ff;
	--sc-surface: #ffffff;
	--sc-surface-soft: #f7f8fc;
	--sc-border: #e6e8f0;
	--sc-danger: #e11d48;
	--sc-danger-soft: #fff1f2;

	position: fixed;
	inset: 0;
	z-index: 10010;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 12px;
	background: rgba(17, 20, 34, 0.56);
	backdrop-filter: blur(3px);

	.sc-modal-dialog {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		max-height: 416px;
		border: 1px solid rgba(255, 255, 255, 0.6);
		border-radius: 12px;
		background: var(--sc-surface);
		box-shadow:
			0 20px 44px rgba(15, 18, 36, 0.28),
			0 2px 8px rgba(15, 18, 36, 0.12);
		overflow: hidden;
	}

	.sc-modal-top {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 11px 12px 11px 14px;
		border-bottom: 1px solid #eef0f6;
		background: linear-gradient(180deg, #ffffff 0%, #f9f8fd 100%);
		flex: 0 0 auto;

		.sc-modal-back {
			display: inline-grid;
			place-items: center;
			width: 26px;
			height: 26px;
			margin-left: -4px;
			padding: 0;
			border: 0;
			border-radius: 7px;
			background: transparent;
			color: var(--sc-muted);
			font-size: 20px;
			line-height: 1;
			cursor: pointer;

			&:hover {
				background: #edeaf6;
				color: var(--sc-ink);
			}
		}

		.sc-modal-title {
			flex: 1 1 0;
			min-width: 0;
			color: var(--sc-ink);
			font-size: 13.5px;
			font-weight: 650;
		}

		.sc-modal-close {
			display: inline-grid;
			place-items: center;
			width: 26px;
			height: 26px;
			padding: 0;
			border: 0;
			border-radius: 7px;
			background: transparent;
			color: var(--sc-subtle);
			font-size: 19px;
			line-height: 1;
			cursor: pointer;

			&:hover {
				background: #f0f1f7;
				color: var(--sc-ink);
			}
		}
	}

	.sc-modal-body {
		flex: 1 1 0;
		overflow-y: auto;
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 14px;

		.field-section {
			display: flex;
			flex-direction: column;
			gap: 6px;

			.field-label {
				color: var(--sc-muted);
				font-size: 11.5px;
				font-weight: 600;
			}
		}
	}

	.capture-stage {
		position: relative;
		border: 1.5px dashed #d3d7e6;
		border-radius: 11px;
		background: radial-gradient(circle at 50% 0%, #ffffff 0%, #f6f7fb 100%);
		transition:
			border-color 0.16s,
			box-shadow 0.16s,
			background 0.16s;

		&:hover {
			border-color: #b79ff8;
		}

		&.filled {
			border-style: solid;
			border-color: #e3e6f0;
		}

		&.recording {
			border-style: solid;
			border-color: var(--sc-accent);
			background: radial-gradient(circle at 50% 0%, #fdfcff 0%, #f5efff 100%);
			box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.14);
		}

		.capture-surface {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			width: 100%;
			min-height: 62px;
			padding: 10px 36px;
			border: 0;
			background: transparent;
			font: inherit;
			cursor: pointer;
			outline: 0;

			.ghost-keycap {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 24px;
				height: 24px;
				border: 1px dashed #c1c6d8;
				border-radius: 6px;
				color: var(--sc-subtle);
				font-size: 12px;
				font-weight: 600;
			}

			.capture-idle-text {
				color: var(--sc-muted);
				font-size: 12.5px;
			}

			.pulse-ring {
				width: 8px;
				height: 8px;
				border-radius: 50%;
				background: var(--sc-accent);
				animation: sc-pulse 1.2s ease-out infinite;
			}

			.capture-live-text {
				color: var(--sc-accent-hover);
				font-size: 12.5px;
				font-weight: 600;
			}
		}

		.capture-clear {
			position: absolute;
			top: 50%;
			right: 9px;
			transform: translateY(-50%);
			display: inline-grid;
			place-items: center;
			width: 24px;
			height: 24px;
			padding: 0;
			border: 0;
			border-radius: 6px;
			background: transparent;
			color: var(--sc-subtle);
			font-size: 16px;
			line-height: 1;
			cursor: pointer;

			&:hover {
				background: var(--sc-danger-soft);
				color: var(--sc-danger);
			}
		}
	}

	.keycaps {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px;

		kbd {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			min-width: 34px;
			height: 32px;
			padding: 0 10px;
			border: 1px solid #d5d9e6;
			border-radius: 8px;
			background: linear-gradient(180deg, #ffffff 0%, #f3f5fa 100%);
			box-shadow:
				0 2.5px 0 #cfd4e3,
				inset 0 1px 0 #ffffff;
			color: #25283a;
			font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
			font-size: 13px;
			font-weight: 700;
			line-height: 1;
		}

		.keycap-sep {
			color: #adb2c4;
			font-size: 11px;
			font-weight: 700;
		}
	}

	.keycap-pop {
		animation: sc-pop 0.18s cubic-bezier(0.22, 1.4, 0.36, 1);
	}

	.notice-strip {
		padding: 7px 10px;
		border-left: 3px solid transparent;
		border-radius: 7px;
		font-size: 11.5px;
		line-height: 1.45;

		&.is-conflict {
			border-left-color: var(--sc-danger);
			background: var(--sc-danger-soft);
			color: #be123c;
		}

		&.is-native {
			border-left-color: #f59e0b;
			background: #fffbeb;
			color: #92400e;
		}
	}

	.action-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		width: 100%;
		padding: 9px 12px;
		border: 1px solid var(--sc-border);
		border-radius: 10px;
		background: #ffffff;
		box-shadow: 0 1px 3px rgba(20, 24, 42, 0.04);
		color: var(--sc-ink);
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition:
			border-color 0.15s,
			background-color 0.15s,
			box-shadow 0.15s;

		&:hover {
			border-color: var(--sc-accent-border);
			background: #fdfcff;
			box-shadow: 0 3px 10px rgba(124, 58, 237, 0.09);

			.action-trigger-icon {
				background: var(--sc-accent-soft);
				color: var(--sc-accent);
			}

			.action-trigger-chevron {
				color: var(--sc-accent);
				transform: translateX(2px);
			}
		}

		.action-trigger-icon {
			display: inline-grid;
			place-items: center;
			width: 30px;
			height: 30px;
			border-radius: 8px;
			background: #f3f4f9;
			color: #5b6076;
			flex: 0 0 auto;
			transition:
				background-color 0.15s,
				color 0.15s;

			svg {
				width: 15px;
				height: 15px;
			}
		}

		.action-trigger-meta {
			display: flex;
			flex-direction: column;
			gap: 2px;
			min-width: 0;
			flex: 1 1 0;

			.action-trigger-group {
				color: var(--sc-subtle);
				font-size: 10.5px;
				font-weight: 600;
				letter-spacing: 0.02em;
			}

			.action-trigger-text {
				color: var(--sc-ink);
				font-size: 13px;
				font-weight: 600;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}

		.action-trigger-chevron {
			flex: 0 0 auto;
			color: var(--sc-subtle);
			font-size: 18px;
			line-height: 1;
			transition:
				color 0.15s,
				transform 0.15s;
		}
	}

	.param-block {
		padding: 11px 12px;
		border: 1px solid #eceef6;
		border-radius: 10px;
		background: var(--sc-surface-soft);

		.param-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
			margin-bottom: 9px;

			.param-label {
				color: var(--sc-muted);
				font-size: 12px;
				font-weight: 600;
			}

			.unit-input {
				display: inline-flex;
				align-items: center;
				height: 28px;
				padding: 0 9px 0 2px;
				border: 1px solid #d9dce8;
				border-radius: 7px;
				background: #ffffff;
				transition:
					border-color 0.14s,
					box-shadow 0.14s;

				&:focus-within {
					border-color: var(--sc-accent);
					box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.14);
				}

				input {
					width: 64px;
					min-height: 0;
					height: 26px;
					padding: 0 4px 0 6px;
					border: 0 !important;
					background: transparent;
					box-shadow: none !important;
					color: var(--sc-ink);
					font-size: 12.5px;
					font-weight: 600;
					font-variant-numeric: tabular-nums;
					text-align: right;
				}

				span {
					color: var(--sc-subtle);
					font-size: 11.5px;
					font-weight: 600;
				}
			}
		}

		.param-pills,
		.quality-grid {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
		}

		.param-pill {
			padding: 5px 10px;
			border: 1px solid #dfe2ec;
			border-radius: 8px;
			background: #ffffff;
			color: var(--sc-muted);
			font: inherit;
			font-size: 11.5px;
			font-weight: 550;
			font-variant-numeric: tabular-nums;
			cursor: pointer;
			transition:
				border-color 0.14s,
				background-color 0.14s,
				color 0.14s;

			&:hover {
				border-color: var(--sc-accent-border);
				color: var(--sc-accent-hover);
			}

			&.active {
				border-color: var(--sc-accent);
				background: var(--sc-accent);
				color: #ffffff;
			}
		}
	}

	.sc-modal-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 10px 14px;
		border-top: 1px solid #eef0f6;
		background: #fafbfe;
		flex: 0 0 auto;

		.danger-ghost-btn {
			height: 32px;
			padding: 0 10px;
			border: 0;
			border-radius: 8px;
			background: transparent;
			color: var(--sc-danger);
			font: inherit;
			font-size: 12px;
			font-weight: 550;
			cursor: pointer;

			&:hover {
				background: var(--sc-danger-soft);
			}
		}

		.footer-right {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-left: auto;

			.ghost-btn {
				height: 32px;
				padding: 0 12px;
				border: 1px solid var(--sc-border);
				border-radius: 8px;
				background: #ffffff;
				color: var(--sc-muted);
				font: inherit;
				font-size: 12px;
				font-weight: 550;
				cursor: pointer;

				&:hover {
					background: var(--sc-surface-soft);
					color: var(--sc-ink);
				}
			}

			.commit-btn {
				height: 32px;
				padding: 0 16px;
				border: 0;
				border-radius: 8px;
				background: var(--sc-accent);
				color: #ffffff;
				font: inherit;
				font-size: 12px;
				font-weight: 600;
				cursor: pointer;
				transition:
					background-color 0.14s,
					opacity 0.14s;

				&:hover:not(:disabled) {
					background: var(--sc-accent-hover);
				}

				&:disabled {
					opacity: 0.38;
					cursor: not-allowed;
				}
			}
		}
	}

	.picker-toolbar {
		flex: 0 0 auto;
		border-bottom: 1px solid #eceef6;
		background: #ffffff;

		.picker-search {
			display: flex;
			align-items: center;
			gap: 6px;
			margin: 10px 12px 0;
			padding: 0 10px;
			height: 33px;
			border: 1px solid #e2e5f0;
			border-radius: 8px;
			background: var(--sc-surface-soft);
			transition:
				border-color 0.14s,
				background-color 0.14s,
				box-shadow 0.14s;

			&:focus-within {
				border-color: var(--sc-accent);
				background: #ffffff;
				box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.12);
			}

			input {
				flex: 1 1 0;
				min-width: 0;
				min-height: 0;
				height: 28px;
				padding: 0;
				border: 0 !important;
				background: transparent;
				box-shadow: none !important;
				color: var(--sc-ink);
				font-size: 12.5px;

				&::placeholder {
					color: var(--sc-subtle);
				}
			}

			.search-clear {
				padding: 0 3px;
				border: 0;
				background: transparent;
				color: var(--sc-subtle);
				font-size: 15px;
				cursor: pointer;

				&:hover {
					color: var(--sc-ink);
				}
			}
		}

		.picker-tabs {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 3px;
			padding: 8px 12px;

			.picker-tab {
				flex: 0 0 auto;
				padding: 4px 8px;
				border: 0;
				border-radius: 6px;
				background: transparent;
				color: var(--sc-muted);
				font: inherit;
				font-size: 11.5px;
				font-weight: 500;
				cursor: pointer;
				transition:
					background-color 0.14s,
					color 0.14s;

				&:hover {
					background: #f2f3f8;
					color: var(--sc-ink);
				}

				&.active {
					background: var(--sc-accent-soft);
					color: var(--sc-accent-hover);
					font-weight: 650;
				}
			}
		}
	}

	.picker-list {
		flex: 1 1 0;
		overflow-y: auto;
		padding: 0 8px 10px;
		background: #fcfcfe;

		.picker-group {
			& + .picker-group {
				margin-top: 6px;
			}

			.picker-group-header {
				position: sticky;
				top: 0;
				z-index: 1;
				display: flex;
				align-items: center;
				justify-content: space-between;
				margin: 0 -8px;
				padding: 7px 16px 5px;
				background: rgba(252, 252, 254, 0.96);
				backdrop-filter: blur(4px);
				color: var(--sc-subtle);
				font-size: 11px;
				font-weight: 650;
				letter-spacing: 0.03em;

				.group-count {
					font-size: 10px;
					font-weight: 600;
					font-variant-numeric: tabular-nums;
					opacity: 0.75;
				}
			}

			.picker-group-items {
				display: flex;
				flex-direction: column;
				gap: 2px;
			}
		}

		.picker-option {
			position: relative;
			display: flex;
			align-items: center;
			gap: 8px;
			width: 100%;
			padding: 8px 10px;
			border: 0;
			border-radius: 8px;
			background: transparent;
			color: var(--sc-ink);
			font: inherit;
			font-size: 12.5px;
			text-align: left;
			cursor: pointer;
			transition: background-color 0.12s;

			&:hover {
				background: #f2f3f8;

				.option-icon {
					color: #4b5066;
				}
			}

			&.selected {
				background: var(--sc-accent-soft);
				color: var(--sc-accent-hover);
				font-weight: 600;

				.option-icon {
					color: var(--sc-accent);
				}

				&::before {
					content: "";
					position: absolute;
					left: 0;
					top: 7px;
					bottom: 7px;
					width: 3px;
					border-radius: 0 3px 3px 0;
					background: var(--sc-accent);
				}
			}

			.option-icon {
				width: 14px;
				height: 14px;
				color: #8c91a6;
				flex: 0 0 auto;
				transition: color 0.12s;
			}

			.option-label {
				flex: 1 1 0;
				min-width: 0;
			}

			.option-tag {
				flex: 0 0 auto;
				padding: 1px 5px;
				border: 1px solid #e4e6f0;
				border-radius: 4px;
				background: #ffffff;
				color: var(--sc-subtle);
				font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
				font-size: 10px;
				font-weight: 600;
			}

			.option-check {
				flex: 0 0 auto;
				color: var(--sc-accent);
				font-size: 13px;
				font-weight: 700;
				line-height: 1;
			}
		}

		.picker-empty {
			padding: 32px 12px;
			text-align: center;
			color: var(--sc-subtle);
			font-size: 12px;
		}
	}
}

.sc-modal-fade-enter-active,
.sc-modal-fade-leave-active {
	transition: opacity 0.16s ease;

	.sc-modal-dialog {
		transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
	}
}

.sc-modal-fade-enter-from,
.sc-modal-fade-leave-to {
	opacity: 0;

	.sc-modal-dialog {
		transform: translateY(8px) scale(0.97);
	}
}

@keyframes sc-pulse {
	0% {
		box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.45);
	}
	70% {
		box-shadow: 0 0 0 8px rgba(124, 58, 237, 0);
	}
	100% {
		box-shadow: 0 0 0 0 rgba(124, 58, 237, 0);
	}
}

@keyframes sc-pop {
	0% {
		transform: scale(0.9);
	}
	100% {
		transform: scale(1);
	}
}
</style>
