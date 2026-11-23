<template>
	<SettingsCard card-id="other-shortcuts">
		<template #title>
			<span>{{ $t("other.shortcuts.title") }}</span>
			<DocsHelpLink anchor="other-shortcuts" />
			<span v-if="items.length" class="title-count">{{ enabledCount }}/{{ items.length }}</span>
		</template>

		<div class="card-body shortcuts-workspace">
			<div
				class="master-toggle-row"
				:class="{ on: config['other.shortcuts.enable'] }"
				@click="config['other.shortcuts.enable'] = !config['other.shortcuts.enable']"
			>
				<span class="enable-label">{{ $t("other.shortcuts.checkbox.enable") }}</span>
				<DocsHelpLink anchor="other-shortcuts-custom" />
				<button
					type="button"
					role="switch"
					class="switch-track"
					:aria-checked="config['other.shortcuts.enable']"
					:aria-label="$t('other.shortcuts.checkbox.enable')"
					@click.stop="config['other.shortcuts.enable'] = !config['other.shortcuts.enable']"
				>
					<span class="switch-thumb"></span>
				</button>
			</div>

			<div class="workspace-content" :class="{ disabled: !config['other.shortcuts.enable'] }">
				<div class="action-bar">
					<button type="button" class="primary-add-btn" @click="openCreateModal">
						<svg viewBox="0 0 16 16" aria-hidden="true">
							<path d="M8 3.2v9.6M3.2 8h9.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
						<span>{{ $t("other.shortcuts.button.add") }}</span>
					</button>

					<button
						type="button"
						class="preset-trigger-btn"
						:title="$t('other.shortcuts.preset.title')"
						@click="presetModalOpen = true"
					>
						<svg viewBox="0 0 16 16" aria-hidden="true">
							<path
								d="M8 2.2 9.4 6l3.8 1.4-3.8 1.4L8 12.6 6.6 8.8 2.8 7.4 6.6 6 8 2.2Z"
								fill="none"
								stroke="currentColor"
								stroke-width="1.35"
								stroke-linejoin="round"
							/>
						</svg>
						<span>{{ $t("other.shortcuts.preset.button") }}</span>
					</button>
				</div>

				<transition name="pill-fade">
					<div v-if="feedbackMessage" class="feedback-pill" role="status">
						<span class="feedback-dot"></span>
						<span>{{ feedbackMessage }}</span>
					</div>
				</transition>

				<div v-if="items.length" class="shortcut-list">
					<div
						v-for="item in items"
						:key="item.id"
						class="shortcut-card"
						:class="{
							'is-disabled': !item.enabled,
							'is-conflict': item.enabled && duplicateKeys.has(item.key),
						}"
						@click="openEditModal(item, false)"
					>
						<button
							type="button"
							role="switch"
							class="row-icon-toggle"
							:class="{ active: item.enabled }"
							:aria-checked="item.enabled"
							:aria-label="$t('other.shortcuts.list.toggle')"
							:title="$t('other.shortcuts.list.toggle')"
							@click.stop="toggleItemEnabled(item.id)"
						>
							<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
								<path
									:d="SHORTCUT_ACTION_ICONS[item.action]"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</button>

						<div class="row-info">
							<span class="row-action">{{ $t(`other.shortcuts.actions.${item.action}`) }}</span>
							<span v-if="formatItemParamBadge(item)" class="row-param">{{ formatItemParamBadge(item) }}</span>
						</div>

						<div class="row-right">
							<button
								type="button"
								class="row-keycaps-btn"
								:title="$t('other.shortcuts.list.editKey')"
								@click.stop="openEditModal(item, true)"
							>
								<span class="keycaps" :class="{ 'is-conflict': item.enabled && duplicateKeys.has(item.key) }">
									<template v-for="(part, index) in formatShortcutParts(item.key)" :key="`${part}-${index}`">
										<span v-if="index > 0" class="keycap-sep">+</span>
										<kbd>{{ part }}</kbd>
									</template>
								</span>
							</button>

							<button
								type="button"
								class="row-remove"
								:title="$t('other.shortcuts.list.remove')"
								:aria-label="$t('other.shortcuts.list.remove')"
								@click.stop="removeItem(item.id)"
							>
								×
							</button>
						</div>
					</div>
				</div>

				<div v-else class="empty-stage">
					<div class="empty-keycaps" aria-hidden="true">
						<kbd>D</kbd>
						<kbd>S</kbd>
						<kbd>R</kbd>
						<kbd>A</kbd>
					</div>
					<div class="empty-title">{{ $t("other.shortcuts.empty.title") }}</div>
					<div class="empty-desc">{{ $t("other.shortcuts.empty.description") }}</div>
					<button type="button" class="empty-preset-btn" @click="applyPreset('speedControl')">
						{{ $t("other.shortcuts.empty.quickPreset") }}
					</button>
				</div>

				<div class="workspace-footer">
					<span class="footer-note">{{ $t("other.shortcuts.tips.inputSafe") }}</span>
					<button
						v-if="items.length"
						type="button"
						class="clear-all-btn"
						:class="{ confirming: confirmClearAll }"
						@click="handleClearAll"
					>
						{{ confirmClearAll ? $t("other.shortcuts.button.confirmClearAll") : $t("other.shortcuts.button.clearAll") }}
					</button>
				</div>
			</div>
		</div>

		<ShortcutEditorModal
			:open="editorModalOpen"
			:title="editingItem ? $t('other.shortcuts.editor.editTitle') : $t('other.shortcuts.editor.addTitle')"
			:submit-label="editingItem ? $t('other.shortcuts.button.save') : $t('other.shortcuts.button.confirmAdd')"
			:can-delete="!!editingItem"
			:initial-key="editingItem?.key ?? ''"
			:initial-action="editingItem?.action ?? 'speed.toggle'"
			:initial-value="editingItem?.value"
			:auto-record="editorAutoRecord"
			:find-conflict-action="(key) => findConflictAction(key, editingItem?.id ?? null)"
			@save="handleModalSave"
			@delete="handleModalDelete"
			@close="closeEditorModal"
		/>

		<Teleport to="body">
			<transition name="sc-modal-fade">
				<div v-if="presetModalOpen" class="preset-modal-backdrop" @click.self="presetModalOpen = false">
					<div class="preset-modal-dialog" role="dialog" aria-modal="true">
						<div class="preset-modal-top">
							<span class="preset-modal-title">{{ $t("other.shortcuts.preset.title") }}</span>
							<button
								type="button"
								class="preset-modal-close"
								:aria-label="$t('other.shortcuts.button.cancel')"
								@click="presetModalOpen = false"
							>
								×
							</button>
						</div>

						<div class="preset-modal-list">
							<button
								v-for="preset in SHORTCUT_PRESETS"
								:key="preset.id"
								type="button"
								class="preset-modal-card"
								@click="applyPreset(preset.id)"
							>
								<div class="preset-card-head">
									<span class="preset-card-name">{{ $t(`other.shortcuts.preset.${preset.id}`) }}</span>
									<span class="preset-card-add">+</span>
								</div>
								<div class="preset-card-rows">
									<div v-for="entry in preset.items" :key="entry.key" class="preset-preview-item">
										<kbd>{{ formatCompactKey(entry.key) }}</kbd>
										<span class="preview-action">{{ $t(`other.shortcuts.actions.${entry.action}`) }}</span>
										<span v-if="formatPreviewBadge(entry)" class="preview-param">{{ formatPreviewBadge(entry) }}</span>
									</div>
								</div>
							</button>
						</div>
					</div>
				</div>
			</transition>
		</Teleport>
	</SettingsCard>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import DocsHelpLink from "../DocsHelpLink.vue";
import SettingsCard from "../SettingsCard.vue";
import ShortcutEditorModal from "./ShortcutEditorModal.vue";
import useConfigStore from "../../util/config";
import { SHORTCUT_ACTION_ICONS } from "../../util/shortcutIcons";
import {
	SHORTCUT_ACTION_MAP,
	SHORTCUT_PRESETS,
	SHORTCUT_QUALITY_OPTIONS,
	createShortcutId,
	formatShortcutParts,
	type KeyboardShortcutItem,
	type ShortcutAction,
	type ShortcutPreset,
} from "@/util/shortcuts";

const config = useConfigStore();
const { t } = useI18n();

const items = computed<KeyboardShortcutItem[]>(() => {
	return Array.isArray(config["other.shortcuts.items"]) ? config["other.shortcuts.items"] : [];
});

const enabledCount = computed(() => items.value.filter((item) => item.enabled).length);

const editorModalOpen = ref(false);
const editingItem = ref<KeyboardShortcutItem | null>(null);
const editorAutoRecord = ref(false);
const presetModalOpen = ref(false);
const feedbackMessage = ref("");
const confirmClearAll = ref(false);

let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
let clearConfirmTimer: ReturnType<typeof setTimeout> | undefined;

const duplicateKeys = computed(() => {
	const counts = new Map<string, number>();
	for (const item of items.value) {
		if (!item.enabled) continue;
		counts.set(item.key, (counts.get(item.key) ?? 0) + 1);
	}
	return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key));
});

function showFeedback(message: string) {
	feedbackMessage.value = message;
	if (feedbackTimer) clearTimeout(feedbackTimer);
	feedbackTimer = setTimeout(() => {
		feedbackMessage.value = "";
		feedbackTimer = undefined;
	}, 2600);
}

function updateItems(nextItems: KeyboardShortcutItem[]) {
	config["other.shortcuts.items"] = nextItems;
}

function findConflictAction(key: string, excludeId: string | null): ShortcutAction | null {
	return items.value.find((item) => item.key === key && item.id !== excludeId)?.action ?? null;
}

function openCreateModal() {
	presetModalOpen.value = false;
	editingItem.value = null;
	editorAutoRecord.value = true;
	editorModalOpen.value = true;
}

function openEditModal(item: KeyboardShortcutItem, autoRecord: boolean) {
	presetModalOpen.value = false;
	editingItem.value = item;
	editorAutoRecord.value = autoRecord;
	editorModalOpen.value = true;
}

function closeEditorModal() {
	editorModalOpen.value = false;
	editingItem.value = null;
	editorAutoRecord.value = false;
}

function handleModalSave(payload: { key: string; action: ShortcutAction; value?: number | string }) {
	if (editingItem.value) {
		const targetId = editingItem.value.id;
		updateItems(
			items.value.map((item) => {
				if (item.id !== targetId) return item;
				const { value: _oldValue, ...rest } = item;
				return { ...rest, ...payload };
			}),
		);
	} else {
		updateItems([
			...items.value,
			{
				id: createShortcutId(),
				enabled: true,
				...payload,
			},
		]);
	}
	closeEditorModal();
}

function handleModalDelete() {
	if (!editingItem.value) return;
	removeItem(editingItem.value.id);
	closeEditorModal();
}

function toggleItemEnabled(id: string) {
	updateItems(items.value.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
}

function removeItem(id: string) {
	updateItems(items.value.filter((item) => item.id !== id));
}

function applyPreset(presetId: ShortcutPreset["id"]) {
	const preset = SHORTCUT_PRESETS.find((entry) => entry.id === presetId);
	if (!preset) return;

	const existingKeys = new Set(items.value.map((item) => item.key));
	const toAdd: KeyboardShortcutItem[] = [];
	for (const entry of preset.items) {
		if (existingKeys.has(entry.key)) continue;
		existingKeys.add(entry.key);
		toAdd.push({
			id: createShortcutId(),
			enabled: true,
			key: entry.key,
			action: entry.action,
			...(entry.value !== undefined ? { value: entry.value } : {}),
		});
	}

	presetModalOpen.value = false;
	if (toAdd.length) {
		updateItems([...items.value, ...toAdd]);
		showFeedback(t("other.shortcuts.preset.applied", { count: toAdd.length }));
	} else {
		showFeedback(t("other.shortcuts.preset.alreadyAdded"));
	}
}

function handleClearAll() {
	if (!confirmClearAll.value) {
		confirmClearAll.value = true;
		if (clearConfirmTimer) clearTimeout(clearConfirmTimer);
		clearConfirmTimer = setTimeout(() => {
			confirmClearAll.value = false;
			clearConfirmTimer = undefined;
		}, 3000);
		return;
	}

	confirmClearAll.value = false;
	if (clearConfirmTimer) clearTimeout(clearConfirmTimer);
	clearConfirmTimer = undefined;
	closeEditorModal();
	updateItems([]);
}

function formatCompactKey(key: string) {
	return formatShortcutParts(key)
		.map((part) => (part === "Shift" ? "⇧" : part))
		.join("");
}

function formatParamBadge(action: ShortcutAction, rawValue?: number | string) {
	const param = SHORTCUT_ACTION_MAP[action]?.param;
	if (!param) return "";

	const value = rawValue ?? param.defaultValue;
	if (param.kind === "speedStep") {
		if (value === "buttons") return t("other.shortcuts.param.followSpeedButtonsShort");
		return action === "speed.down" ? `-${value}×` : `+${value}×`;
	}
	if (param.kind === "speed") return `${value}×`;
	if (param.kind === "seconds") return action === "playback.seekBackward" ? `-${value}s` : `+${value}s`;
	if (param.kind === "volume") {
		if (action === "audio.volumeUp") return `+${value}%`;
		if (action === "audio.volumeDown") return `-${value}%`;
		return `${value}%`;
	}
	if (param.kind === "quality") {
		if (value === "auto") return t("other.shortcuts.param.qualityAuto");
		const fullLabel = SHORTCUT_QUALITY_OPTIONS.find((option) => option.value === value)?.label || String(value);
		return fullLabel.replace(/\s*\(.*?\)/, "");
	}
	return "";
}

function formatItemParamBadge(item: KeyboardShortcutItem) {
	return formatParamBadge(item.action, item.value);
}

function formatPreviewBadge(entry: Omit<KeyboardShortcutItem, "id" | "enabled">) {
	return formatParamBadge(entry.action, entry.value);
}

function handlePresetEscape(event: KeyboardEvent) {
	if (presetModalOpen.value && event.key === "Escape") {
		event.preventDefault();
		presetModalOpen.value = false;
	}
}

watch(presetModalOpen, (open) => {
	if (open) window.addEventListener("keydown", handlePresetEscape);
	else window.removeEventListener("keydown", handlePresetEscape);
});

watch(
	() => config["other.shortcuts.enable"],
	(enabled) => {
		if (!enabled) {
			closeEditorModal();
			presetModalOpen.value = false;
		}
	},
);

onBeforeUnmount(() => {
	window.removeEventListener("keydown", handlePresetEscape);
	if (feedbackTimer) clearTimeout(feedbackTimer);
	if (clearConfirmTimer) clearTimeout(clearConfirmTimer);
});
</script>

<style lang="scss" scoped>
.title-count {
	padding: 1px 6px;
	border-radius: 999px;
	background: #eceef5;
	color: #6b7184;
	font-size: 10.5px;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
	line-height: 1.4;
}

.shortcuts-workspace {
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

	padding-top: 8px !important;

	.master-toggle-row {
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		width: 100%;
		padding: 6px 4px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: var(--sc-ink);
		font: inherit;
		font-size: 12.5px;
		font-weight: 500;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.14s ease;

		&:hover {
			background: var(--sc-surface-soft);

			> :deep(.docs-help-link) {
				opacity: 1;
				pointer-events: auto;
			}
		}

		&:focus-within > :deep(.docs-help-link) {
			opacity: 1;
			pointer-events: auto;
		}

		> :deep(.docs-help-link) {
			margin-left: 0;
		}

		.enable-label {
			flex: 1 1 0;
			min-width: 0;
		}

		.switch-track {
			position: relative;
			width: 32px;
			height: 19px;
			padding: 0;
			border: 0;
			border-radius: 999px;
			background: #b6bbc7;
			flex: 0 0 auto;
			cursor: pointer;
			transition: background-color 0.18s ease;

			.switch-thumb {
				position: absolute;
				top: 3px;
				left: 3px;
				width: 13px;
				height: 13px;
				border-radius: 50%;
				background: #ffffff;
				box-shadow: 0 1px 3px rgba(15, 23, 42, 0.18);
				transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
			}
		}

		&.on .switch-track {
			background: var(--settings-accent);

			.switch-thumb {
				transform: translateX(13px);
			}
		}
	}

	.workspace-content {
		margin-top: 8px;
		transition:
			opacity 0.18s ease,
			filter 0.18s ease;

		&.disabled {
			opacity: 0.44;
			filter: saturate(0.35);
			pointer-events: none;
		}
	}

	.action-bar {
		display: flex;
		align-items: center;
		gap: 7px;

		.primary-add-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 5px;
			flex: 1 1 0;
			height: 32px;
			padding: 0 12px;
			border: 0;
			border-radius: 9px;
			background: #1f2233;
			color: #ffffff;
			font: inherit;
			font-size: 12px;
			font-weight: 600;
			cursor: pointer;
			box-shadow: 0 2px 6px rgba(24, 27, 45, 0.14);
			transition:
				background-color 0.15s,
				transform 0.12s,
				box-shadow 0.15s;

			svg {
				width: 12px;
				height: 12px;
			}

			&:hover {
				background: var(--sc-accent);
				box-shadow: 0 3px 10px rgba(124, 58, 237, 0.25);
			}

			&:active {
				transform: translateY(1px);
			}
		}

		.preset-trigger-btn {
			display: inline-flex;
			align-items: center;
			gap: 5px;
			height: 32px;
			padding: 0 11px;
			border: 1px solid var(--sc-border);
			border-radius: 9px;
			background: var(--sc-surface-soft);
			color: var(--sc-muted);
			font: inherit;
			font-size: 12px;
			font-weight: 550;
			cursor: pointer;
			transition:
				border-color 0.15s,
				background-color 0.15s,
				color 0.15s;

			svg {
				width: 12px;
				height: 12px;
			}

			&:hover {
				border-color: var(--sc-accent-border);
				background: var(--sc-accent-soft);
				color: var(--sc-accent);
			}
		}
	}

	.feedback-pill {
		display: flex;
		align-items: center;
		gap: 7px;
		margin-top: 9px;
		padding: 6px 10px;
		border-radius: 8px;
		background: var(--sc-accent-soft);
		color: var(--sc-accent-hover);
		font-size: 11.5px;
		font-weight: 550;

		.feedback-dot {
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: var(--sc-accent);
			flex: 0 0 auto;
		}
	}

	.keycaps {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 3px;

		kbd {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			min-width: 24px;
			height: 23px;
			padding: 0 6px;
			border: 1px solid #d5d9e6;
			border-radius: 6px;
			background: linear-gradient(180deg, #ffffff 0%, #f3f5fa 100%);
			box-shadow:
				0 2px 0 #cfd4e3,
				inset 0 1px 0 #ffffff;
			color: #25283a;
			font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
			font-size: 11px;
			font-weight: 650;
			line-height: 1;
			transition:
				transform 0.1s,
				box-shadow 0.1s,
				border-color 0.14s,
				color 0.14s;
		}

		.keycap-sep {
			color: #adb2c4;
			font-size: 10px;
			font-weight: 700;
		}

		&.is-conflict kbd {
			border-color: #fda4af;
			background: linear-gradient(180deg, #fff5f6 0%, #ffe4e8 100%);
			box-shadow: 0 2px 0 #f43f5e66;
			color: var(--sc-danger);
		}
	}

	.shortcut-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 10px;

		.shortcut-card {
			display: flex;
			align-items: center;
			gap: 9px;
			min-height: 44px;
			padding: 6px 8px 6px 8px;
			border: 1px solid #eceef5;
			border-radius: 10px;
			background: #fafbfe;
			cursor: pointer;
			transition:
				border-color 0.16s,
				background-color 0.16s,
				box-shadow 0.16s;

			&:hover {
				border-color: #d8ccfb;
				background: #ffffff;
				box-shadow: 0 2px 8px rgba(124, 58, 237, 0.08);

				.row-remove {
					opacity: 1;
				}
			}

			&.is-conflict {
				border-color: #fecdd3;
				background: #fffafb;
			}

			&.is-disabled {
				.row-info,
				.row-keycaps-btn {
					opacity: 0.42;
				}

				.row-action {
					text-decoration: line-through;
				}
			}

			.row-icon-toggle {
				display: inline-grid;
				place-items: center;
				width: 26px;
				height: 26px;
				padding: 0;
				border: 1px solid #e4e7f0;
				border-radius: 7px;
				background: #f1f2f7;
				color: #a4a9bc;
				cursor: pointer;
				flex: 0 0 auto;
				transition:
					background-color 0.15s,
					border-color 0.15s,
					color 0.15s,
					transform 0.1s;

				svg {
					width: 14px;
					height: 14px;
				}

				&:hover {
					border-color: var(--sc-accent-border);
					color: var(--sc-accent);
				}

				&:active {
					transform: scale(0.94);
				}

				&.active {
					border-color: transparent;
					background: var(--sc-accent-soft);
					color: var(--sc-accent);

					&:hover {
						background: #e9deff;
					}
				}
			}

			.row-info {
				display: flex;
				align-items: center;
				flex-wrap: wrap;
				gap: 4px 6px;
				flex: 1 1 0;
				min-width: 0;

				.row-action {
					color: var(--sc-ink);
					font-size: 12.5px;
					font-weight: 550;
					line-height: 1.35;
					overflow-wrap: anywhere;
				}

				.row-param {
					padding: 1px 6px;
					border-radius: 5px;
					background: var(--sc-accent-soft);
					color: var(--sc-accent-hover);
					font-size: 10.5px;
					font-weight: 650;
					font-variant-numeric: tabular-nums;
					white-space: nowrap;
				}
			}

			.row-right {
				display: flex;
				align-items: center;
				gap: 4px;
				flex: 0 0 auto;

				.row-keycaps-btn {
					display: inline-flex;
					padding: 2px 0;
					border: 0;
					background: transparent;
					cursor: pointer;

					&:hover kbd {
						border-color: var(--sc-accent-border);
						color: var(--sc-accent-hover);
					}

					&:active kbd {
						transform: translateY(1px);
						box-shadow: 0 1px 0 #cfd4e3;
					}
				}

				.row-remove {
					display: inline-grid;
					place-items: center;
					width: 22px;
					height: 22px;
					padding: 0;
					border: 0;
					border-radius: 6px;
					background: transparent;
					color: var(--sc-subtle);
					font-size: 15px;
					line-height: 1;
					cursor: pointer;
					opacity: 0.35;
					transition:
						opacity 0.14s,
						background-color 0.14s,
						color 0.14s;

					&:hover,
					&:focus-visible {
						opacity: 1;
						background: var(--sc-danger-soft);
						color: var(--sc-danger);
					}
				}
			}
		}
	}

	.empty-stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 10px;
		padding: 16px 14px 14px;
		border: 1px dashed #e0e3ef;
		border-radius: 10px;
		background: radial-gradient(circle at 50% 0%, #faf8ff 0%, #f8f9fc 100%);
		text-align: center;

		.empty-keycaps {
			display: flex;
			align-items: center;
			gap: 6px;
			margin-bottom: 9px;

			kbd {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 28px;
				height: 28px;
				border: 1px solid #ddd6f3;
				border-radius: 7px;
				background: linear-gradient(180deg, #ffffff 0%, #f4f1fd 100%);
				box-shadow:
					0 2px 0 #d6ccef,
					0 4px 10px rgba(124, 58, 237, 0.1);
				color: var(--sc-accent);
				font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
				font-size: 12px;
				font-weight: 700;

				&:nth-child(2) {
					transform: translateY(-2px);
				}
				&:nth-child(3) {
					transform: translateY(1px);
				}
			}
		}

		.empty-title {
			color: var(--sc-ink);
			font-size: 12.5px;
			font-weight: 650;
		}

		.empty-desc {
			margin: 4px 0 11px;
			color: var(--sc-muted);
			font-size: 11.5px;
			line-height: 1.5;
		}

		.empty-preset-btn {
			height: 29px;
			padding: 0 12px;
			border: 1px solid var(--sc-accent-border);
			border-radius: 8px;
			background: #ffffff;
			color: var(--sc-accent-hover);
			font: inherit;
			font-size: 11.5px;
			font-weight: 600;
			cursor: pointer;
			box-shadow: 0 1px 3px rgba(124, 58, 237, 0.08);
			transition:
				background-color 0.14s,
				color 0.14s,
				border-color 0.14s;

			&:hover {
				background: var(--sc-accent);
				border-color: var(--sc-accent);
				color: #ffffff;
			}
		}
	}

	.workspace-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-top: 10px;
		padding-top: 8px;
		border-top: 1px solid #f0f1f7;

		.footer-note {
			color: var(--sc-subtle);
			font-size: 11px;
			line-height: 1.45;
		}

		.clear-all-btn {
			flex: 0 0 auto;
			padding: 3px 7px;
			border: 0;
			border-radius: 6px;
			background: transparent;
			color: var(--sc-subtle);
			font: inherit;
			font-size: 11px;
			font-weight: 550;
			cursor: pointer;
			white-space: nowrap;
			transition:
				background-color 0.14s,
				color 0.14s;

			&:hover,
			&.confirming {
				background: var(--sc-danger-soft);
				color: var(--sc-danger);
			}

			&.confirming {
				font-weight: 650;
			}
		}
	}
}

.preset-modal-backdrop {
	--sc-ink: #1c1f2e;
	--sc-muted: #6e7387;
	--sc-subtle: #979cad;
	--sc-accent: #7c3aed;
	--sc-accent-hover: #6d28d9;
	--sc-accent-soft: #f3eeff;
	--sc-accent-border: #d8c8ff;
	--sc-border: #e6e8f0;

	position: fixed;
	inset: 0;
	z-index: 10010;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 12px;
	background: rgba(17, 20, 34, 0.56);
	backdrop-filter: blur(3px);

	.preset-modal-dialog {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-height: 416px;
		border: 1px solid rgba(255, 255, 255, 0.6);
		border-radius: 12px;
		background: #ffffff;
		box-shadow:
			0 20px 44px rgba(15, 18, 36, 0.28),
			0 2px 8px rgba(15, 18, 36, 0.12);
		overflow: hidden;

		.preset-modal-top {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 11px 12px 11px 14px;
			border-bottom: 1px solid #eef0f6;
			background: linear-gradient(180deg, #ffffff 0%, #f9f8fd 100%);

			.preset-modal-title {
				color: var(--sc-ink);
				font-size: 13.5px;
				font-weight: 650;
			}

			.preset-modal-close {
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

		.preset-modal-list {
			flex: 1 1 auto;
			min-height: 0;
			overflow-y: auto;
			padding: 12px;
			display: flex;
			flex-direction: column;
			gap: 10px;

			.preset-modal-card {
				width: 100%;
				padding: 10px 11px;
				border: 1px solid var(--sc-border);
				border-radius: 10px;
				background: #fafbfe;
				text-align: left;
				font: inherit;
				cursor: pointer;
				transition:
					border-color 0.15s,
					background-color 0.15s,
					box-shadow 0.15s,
					transform 0.12s;

				&:hover {
					border-color: var(--sc-accent-border);
					background: #ffffff;
					box-shadow: 0 4px 14px rgba(124, 58, 237, 0.12);
					transform: translateY(-1px);

					.preset-card-add {
						background: var(--sc-accent);
						color: #ffffff;
					}
				}

				.preset-card-head {
					display: flex;
					align-items: center;
					justify-content: space-between;
					margin-bottom: 8px;

					.preset-card-name {
						color: var(--sc-ink);
						font-size: 12.5px;
						font-weight: 650;
					}

					.preset-card-add {
						display: inline-grid;
						place-items: center;
						width: 22px;
						height: 22px;
						border-radius: 6px;
						background: var(--sc-accent-soft);
						color: var(--sc-accent);
						font-size: 15px;
						font-weight: 700;
						line-height: 1;
						transition:
							background-color 0.14s,
							color 0.14s;
					}
				}

				.preset-card-rows {
					display: grid;
					grid-template-columns: repeat(2, minmax(0, 1fr));
					gap: 6px;

					.preset-preview-item {
						display: flex;
						align-items: center;
						gap: 5px;
						min-width: 0;
						padding: 4px 6px;
						border-radius: 7px;
						background: #ffffff;
						border: 1px solid #eef0f6;

						kbd {
							display: inline-flex;
							align-items: center;
							justify-content: center;
							min-width: 20px;
							height: 20px;
							padding: 0 5px;
							border: 1px solid #d5d9e6;
							border-radius: 5px;
							background: linear-gradient(180deg, #ffffff 0%, #f3f5fa 100%);
							box-shadow: 0 1.5px 0 #cfd4e3;
							color: #25283a;
							font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
							font-size: 10.5px;
							font-weight: 650;
							flex: 0 0 auto;
						}

						.preview-action {
							flex: 1 1 0;
							min-width: 0;
							color: var(--sc-muted);
							font-size: 11px;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						}

						.preview-param {
							flex: 0 0 auto;
							color: var(--sc-accent-hover);
							font-size: 10px;
							font-weight: 650;
							font-variant-numeric: tabular-nums;
						}
					}
				}
			}
		}
	}
}

.pill-fade-enter-active,
.pill-fade-leave-active {
	transition:
		opacity 0.16s ease,
		transform 0.16s ease;
}

.pill-fade-enter-from,
.pill-fade-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}

.sc-modal-fade-enter-active,
.sc-modal-fade-leave-active {
	transition: opacity 0.16s ease;

	.preset-modal-dialog {
		transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
	}
}

.sc-modal-fade-enter-from,
.sc-modal-fade-leave-to {
	opacity: 0;

	.preset-modal-dialog {
		transform: translateY(8px) scale(0.97);
	}
}
</style>
