
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T extends DefineComponent> = T & DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>>
type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = (T & DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }>)
interface _GlobalComponents {
      'MaterialQaq3DMaterialPreview': typeof import("../components/editor/material/Qaq3DMaterialPreview.vue")['default']
    'MaterialQaqMaterialEditor': typeof import("../components/editor/material/QaqMaterialEditor.vue")['default']
    'MaterialQaqMaterialNodeProperties': typeof import("../components/editor/material/QaqMaterialNodeProperties.vue")['default']
    'MaterialQaqNodeEditor': typeof import("../components/editor/material/QaqNodeEditor.vue")['default']
    'MaterialQaqVueFlowMaterialEdge': typeof import("../components/editor/material/QaqVueFlowMaterialEdge.vue")['default']
    'MaterialQaqVueFlowMaterialNode': typeof import("../components/editor/material/QaqVueFlowMaterialNode.vue")['default']
    'MaterialOutputNode': typeof import("../components/editor/material/nodes/MaterialOutputNode.vue")['default']
    'MaterialMathNode': typeof import("../components/editor/material/nodes/MathNode.vue")['default']
    'MaterialQaqInputNode': typeof import("../components/editor/material/nodes/QaqInputNode.vue")['default']
    'MaterialQaqMathNode': typeof import("../components/editor/material/nodes/QaqMathNode.vue")['default']
    'MaterialQaqOutputNode': typeof import("../components/editor/material/nodes/QaqOutputNode.vue")['default']
    'MaterialTextureSampleNode': typeof import("../components/editor/material/nodes/TextureSampleNode.vue")['default']
    'NodeQaqInputNode': typeof import("../components/editor/nodes/QaqInputNode.vue")['default']
    'NodeQaqMathNode': typeof import("../components/editor/nodes/QaqMathNode.vue")['default']
    'NodeQaqOutputNode': typeof import("../components/editor/nodes/QaqOutputNode.vue")['default']
    'EditorQaqAxisNavigator': typeof import("../components/editor/3d/QaqAxisNavigator.vue")['default']
    'EditorQaqTransformControls': typeof import("../components/editor/3d/QaqTransformControls.vue")['default']
    'EditorQaqViewportGizmo': typeof import("../components/editor/3d/QaqViewportGizmo.vue")['default']
    'EditorQaqAnimationStateMachine': typeof import("../components/editor/QaqAnimationStateMachine.vue")['default']
    'EditorQaqBlueprintMaterialEditor': typeof import("../components/editor/QaqBlueprintMaterialEditor.vue")['default']
    'EditorQaqBottomPanel': typeof import("../components/editor/QaqBottomPanel.vue")['default']
    'EditorQaqCodeEditor': typeof import("../components/editor/QaqCodeEditor.vue")['default']
    'EditorQaqDraggablePanel': typeof import("../components/editor/QaqDraggablePanel.vue")['default']
    'EditorQaqEditorTabs': typeof import("../components/editor/QaqEditorTabs.vue")['default']
    'EditorQaqFileSystemDock': typeof import("../components/editor/QaqFileSystemDock.vue")['default']
    'EditorQaqInspectorDock': typeof import("../components/editor/QaqInspectorDock.vue")['default']
    'EditorQaqMaterialEditor': typeof import("../components/editor/QaqMaterialEditor.vue")['default']
    'EditorQaqMenuBar': typeof import("../components/editor/QaqMenuBar.vue")['default']
    'EditorQaqMonacoEditor': typeof import("../components/editor/QaqMonacoEditor.vue")['default']
    'EditorQaqNodeEditor': typeof import("../components/editor/QaqNodeEditor.vue")['default']
    'EditorQaqPropertyGroup': typeof import("../components/editor/QaqPropertyGroup.vue")['default']
    'EditorQaqSceneTabs': typeof import("../components/editor/QaqSceneTabs.vue")['default']
    'EditorQaqSceneTreeDock': typeof import("../components/editor/QaqSceneTreeDock.vue")['default']
    'EditorQaqSceneTreeNode': typeof import("../components/editor/QaqSceneTreeNode.vue")['default']
    'EditorQaqSimpleCodeEditor': typeof import("../components/editor/QaqSimpleCodeEditor.vue")['default']
    'EditorQaqTabbedPanel': typeof import("../components/editor/QaqTabbedPanel.vue")['default']
    'EditorQaqTerrainEditor': typeof import("../components/editor/QaqTerrainEditor.vue")['default']
    'EditorQaqTestComponent': typeof import("../components/editor/QaqTestComponent.vue")['default']
    'EditorQaqVSCodeEditor': typeof import("../components/editor/QaqVSCodeEditor.vue")['default']
    'EditorQaqViewport3D': typeof import("../components/editor/QaqViewport3D.vue")['default']
    'EditorQaqVueFlowMaterialEditor': typeof import("../components/editor/QaqVueFlowMaterialEditor.vue")['default']
    'EditorSpriteSheetEditor': typeof import("../components/editor/SpriteSheetEditor.vue")['default']
    'EditorAnimationTreeAdapter': typeof import("../components/editor/animation/AnimationTreeAdapter")['default']
    'EditorEntryNode': typeof import("../components/editor/animation/EntryNode.vue")['default']
    'EditorQaqAnimationEditor': typeof import("../components/editor/animation/QaqAnimationEditor.vue")['default']
    'EditorQaqAnimationParameterPanel': typeof import("../components/editor/animation/QaqAnimationParameterPanel.vue")['default']
    'EditorQaqAnimationTreeEditor': typeof import("../components/editor/animation/QaqAnimationTreeEditor.vue")['default']
    'EditorQaqStateMachineEditor': typeof import("../components/editor/animation/QaqStateMachineEditor.vue")['default']
    'EditorQaqTimelineEditor': typeof import("../components/editor/animation/QaqTimelineEditor.vue")['default']
    'EditorStateNode': typeof import("../components/editor/animation/StateNode.vue")['default']
    'EditorTransitionEdge': typeof import("../components/editor/animation/TransitionEdge.vue")['default']
    'EditorQaqMaterialNode': typeof import("../components/editor/blueprint/QaqMaterialNode.vue")['default']
    'EditorProjectDialog': typeof import("../components/editor/dialogs/ProjectDialog.vue")['default']
    'EditorPropertyRenderer': typeof import("../components/editor/inspector/PropertyRenderer.vue")['default']
    'EditorQaqTerrainBrushPanel': typeof import("../components/editor/terrain/QaqTerrainBrushPanel.vue")['default']
    'EditorQaqTerrainBrushProperties': typeof import("../components/editor/terrain/QaqTerrainBrushProperties.vue")['default']
    'EditorQaqTerrainViewport3D': typeof import("../components/editor/terrain/QaqTerrainViewport3D.vue")['default']
    'CreateProjectModal': typeof import("../components/CreateProjectModal.vue")['default']
    'LanguageSwitcher': typeof import("../components/LanguageSwitcher.vue")['default']
    'ProjectCard': typeof import("../components/ProjectCard.vue")['default']
    'ProjectListItem': typeof import("../components/ProjectListItem.vue")['default']
    'QaqStatusCheck': typeof import("../components/QaqStatusCheck.vue")['default']
    'QaqUserDropdown': typeof import("../components/QaqUserDropdown.vue")['default']
    'RenameProjectModal': typeof import("../components/RenameProjectModal.vue")['default']
    'TestComponent': typeof import("../components/TestComponent.vue")['default']
    'TileMapEditor': typeof import("../components/TileMapEditor.vue")['default']
    'UserInfoDebug': typeof import("../components/UserInfoDebug.vue")['default']
    'QaqInteractiveElement': typeof import("../components/ui/QaqInteractiveElement.vue")['default']
    'QaqMouseFollower': typeof import("../components/ui/QaqMouseFollower.vue")['default']
    'UAccordion': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Accordion.vue")['default']
    'UAlert': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Alert.vue")['default']
    'UAvatar': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Avatar.vue")['default']
    'UAvatarGroup': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/AvatarGroup")['default']
    'UBadge': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Badge.vue")['default']
    'UButton': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Button.vue")['default']
    'UButtonGroup': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/ButtonGroup")['default']
    'UCarousel': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Carousel.vue")['default']
    'UChip': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Chip.vue")['default']
    'UDropdown': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Dropdown.vue")['default']
    'UIcon': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Icon.vue")['default']
    'UKbd': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Kbd.vue")['default']
    'ULink': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Link.vue")['default']
    'UMeter': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Meter.vue")['default']
    'UMeterGroup': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/MeterGroup")['default']
    'UProgress': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Progress.vue")['default']
    'UCheckbox': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Checkbox.vue")['default']
    'UForm': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Form.vue")['default']
    'UFormGroup': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/FormGroup.vue")['default']
    'UInput': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Input.vue")['default']
    'UInputMenu': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/InputMenu.vue")['default']
    'URadio': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Radio.vue")['default']
    'URadioGroup': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/RadioGroup.vue")['default']
    'URange': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Range.vue")['default']
    'USelect': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Select.vue")['default']
    'USelectMenu': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/SelectMenu.vue")['default']
    'UTextarea': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Textarea.vue")['default']
    'UToggle': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Toggle.vue")['default']
    'UTable': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/data/Table.vue")['default']
    'UCard': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Card.vue")['default']
    'UContainer': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Container.vue")['default']
    'UDivider': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Divider.vue")['default']
    'USkeleton': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Skeleton.vue")['default']
    'UBreadcrumb': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/Breadcrumb.vue")['default']
    'UCommandPalette': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/CommandPalette.vue")['default']
    'UCommandPaletteGroup': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/CommandPaletteGroup.vue")['default']
    'UHorizontalNavigation': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/HorizontalNavigation.vue")['default']
    'UPagination': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/Pagination.vue")['default']
    'UTabs': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/Tabs.vue")['default']
    'UVerticalNavigation': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/VerticalNavigation.vue")['default']
    'UContextMenu': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/ContextMenu.vue")['default']
    'UModal': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Modal.vue")['default']
    'UModals': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Modals.client.vue")['default']
    'UNotification': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Notification.vue")['default']
    'UNotifications': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Notifications.vue")['default']
    'UPopover': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Popover.vue")['default']
    'USlideover': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Slideover.vue")['default']
    'USlideovers': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Slideovers.client.vue")['default']
    'UTooltip': typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Tooltip.vue")['default']
    'NuxtWelcome': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/welcome.vue")['default']
    'NuxtLayout': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-layout")['default']
    'NuxtErrorBoundary': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
    'ClientOnly': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/client-only")['default']
    'DevOnly': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/dev-only")['default']
    'ServerPlaceholder': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']
    'NuxtLink': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-link")['default']
    'NuxtLoadingIndicator': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
    'NuxtTime': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
    'NuxtRouteAnnouncer': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
    'NuxtImg': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
    'NuxtPicture': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
    'Icon': typeof import("../node_modules/.pnpm/@nuxt+icon@1.15.0_magicast@_c650e22a0cdf7094b2a6e1aa08a1c255/node_modules/@nuxt/icon/dist/runtime/components/index")['default']
    'ColorScheme': typeof import("../node_modules/.pnpm/@nuxtjs+color-mode@3.5.2_magicast@0.3.5/node_modules/@nuxtjs/color-mode/dist/runtime/component.vue3.vue")['default']
    'NuxtPage': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/pages/runtime/page")['default']
    'NoScript': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['NoScript']
    'Link': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Link']
    'Base': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Base']
    'Title': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Title']
    'Meta': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Meta']
    'Style': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Style']
    'Head': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Head']
    'Html': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Html']
    'Body': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Body']
    'NuxtIsland': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-island")['default']
    'UModals': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']
    'USlideovers': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']
    'NuxtRouteAnnouncer': typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']
      'LazyMaterialQaq3DMaterialPreview': LazyComponent<typeof import("../components/editor/material/Qaq3DMaterialPreview.vue")['default']>
    'LazyMaterialQaqMaterialEditor': LazyComponent<typeof import("../components/editor/material/QaqMaterialEditor.vue")['default']>
    'LazyMaterialQaqMaterialNodeProperties': LazyComponent<typeof import("../components/editor/material/QaqMaterialNodeProperties.vue")['default']>
    'LazyMaterialQaqNodeEditor': LazyComponent<typeof import("../components/editor/material/QaqNodeEditor.vue")['default']>
    'LazyMaterialQaqVueFlowMaterialEdge': LazyComponent<typeof import("../components/editor/material/QaqVueFlowMaterialEdge.vue")['default']>
    'LazyMaterialQaqVueFlowMaterialNode': LazyComponent<typeof import("../components/editor/material/QaqVueFlowMaterialNode.vue")['default']>
    'LazyMaterialOutputNode': LazyComponent<typeof import("../components/editor/material/nodes/MaterialOutputNode.vue")['default']>
    'LazyMaterialMathNode': LazyComponent<typeof import("../components/editor/material/nodes/MathNode.vue")['default']>
    'LazyMaterialQaqInputNode': LazyComponent<typeof import("../components/editor/material/nodes/QaqInputNode.vue")['default']>
    'LazyMaterialQaqMathNode': LazyComponent<typeof import("../components/editor/material/nodes/QaqMathNode.vue")['default']>
    'LazyMaterialQaqOutputNode': LazyComponent<typeof import("../components/editor/material/nodes/QaqOutputNode.vue")['default']>
    'LazyMaterialTextureSampleNode': LazyComponent<typeof import("../components/editor/material/nodes/TextureSampleNode.vue")['default']>
    'LazyNodeQaqInputNode': LazyComponent<typeof import("../components/editor/nodes/QaqInputNode.vue")['default']>
    'LazyNodeQaqMathNode': LazyComponent<typeof import("../components/editor/nodes/QaqMathNode.vue")['default']>
    'LazyNodeQaqOutputNode': LazyComponent<typeof import("../components/editor/nodes/QaqOutputNode.vue")['default']>
    'LazyEditorQaqAxisNavigator': LazyComponent<typeof import("../components/editor/3d/QaqAxisNavigator.vue")['default']>
    'LazyEditorQaqTransformControls': LazyComponent<typeof import("../components/editor/3d/QaqTransformControls.vue")['default']>
    'LazyEditorQaqViewportGizmo': LazyComponent<typeof import("../components/editor/3d/QaqViewportGizmo.vue")['default']>
    'LazyEditorQaqAnimationStateMachine': LazyComponent<typeof import("../components/editor/QaqAnimationStateMachine.vue")['default']>
    'LazyEditorQaqBlueprintMaterialEditor': LazyComponent<typeof import("../components/editor/QaqBlueprintMaterialEditor.vue")['default']>
    'LazyEditorQaqBottomPanel': LazyComponent<typeof import("../components/editor/QaqBottomPanel.vue")['default']>
    'LazyEditorQaqCodeEditor': LazyComponent<typeof import("../components/editor/QaqCodeEditor.vue")['default']>
    'LazyEditorQaqDraggablePanel': LazyComponent<typeof import("../components/editor/QaqDraggablePanel.vue")['default']>
    'LazyEditorQaqEditorTabs': LazyComponent<typeof import("../components/editor/QaqEditorTabs.vue")['default']>
    'LazyEditorQaqFileSystemDock': LazyComponent<typeof import("../components/editor/QaqFileSystemDock.vue")['default']>
    'LazyEditorQaqInspectorDock': LazyComponent<typeof import("../components/editor/QaqInspectorDock.vue")['default']>
    'LazyEditorQaqMaterialEditor': LazyComponent<typeof import("../components/editor/QaqMaterialEditor.vue")['default']>
    'LazyEditorQaqMenuBar': LazyComponent<typeof import("../components/editor/QaqMenuBar.vue")['default']>
    'LazyEditorQaqMonacoEditor': LazyComponent<typeof import("../components/editor/QaqMonacoEditor.vue")['default']>
    'LazyEditorQaqNodeEditor': LazyComponent<typeof import("../components/editor/QaqNodeEditor.vue")['default']>
    'LazyEditorQaqPropertyGroup': LazyComponent<typeof import("../components/editor/QaqPropertyGroup.vue")['default']>
    'LazyEditorQaqSceneTabs': LazyComponent<typeof import("../components/editor/QaqSceneTabs.vue")['default']>
    'LazyEditorQaqSceneTreeDock': LazyComponent<typeof import("../components/editor/QaqSceneTreeDock.vue")['default']>
    'LazyEditorQaqSceneTreeNode': LazyComponent<typeof import("../components/editor/QaqSceneTreeNode.vue")['default']>
    'LazyEditorQaqSimpleCodeEditor': LazyComponent<typeof import("../components/editor/QaqSimpleCodeEditor.vue")['default']>
    'LazyEditorQaqTabbedPanel': LazyComponent<typeof import("../components/editor/QaqTabbedPanel.vue")['default']>
    'LazyEditorQaqTerrainEditor': LazyComponent<typeof import("../components/editor/QaqTerrainEditor.vue")['default']>
    'LazyEditorQaqTestComponent': LazyComponent<typeof import("../components/editor/QaqTestComponent.vue")['default']>
    'LazyEditorQaqVSCodeEditor': LazyComponent<typeof import("../components/editor/QaqVSCodeEditor.vue")['default']>
    'LazyEditorQaqViewport3D': LazyComponent<typeof import("../components/editor/QaqViewport3D.vue")['default']>
    'LazyEditorQaqVueFlowMaterialEditor': LazyComponent<typeof import("../components/editor/QaqVueFlowMaterialEditor.vue")['default']>
    'LazyEditorSpriteSheetEditor': LazyComponent<typeof import("../components/editor/SpriteSheetEditor.vue")['default']>
    'LazyEditorAnimationTreeAdapter': LazyComponent<typeof import("../components/editor/animation/AnimationTreeAdapter")['default']>
    'LazyEditorEntryNode': LazyComponent<typeof import("../components/editor/animation/EntryNode.vue")['default']>
    'LazyEditorQaqAnimationEditor': LazyComponent<typeof import("../components/editor/animation/QaqAnimationEditor.vue")['default']>
    'LazyEditorQaqAnimationParameterPanel': LazyComponent<typeof import("../components/editor/animation/QaqAnimationParameterPanel.vue")['default']>
    'LazyEditorQaqAnimationTreeEditor': LazyComponent<typeof import("../components/editor/animation/QaqAnimationTreeEditor.vue")['default']>
    'LazyEditorQaqStateMachineEditor': LazyComponent<typeof import("../components/editor/animation/QaqStateMachineEditor.vue")['default']>
    'LazyEditorQaqTimelineEditor': LazyComponent<typeof import("../components/editor/animation/QaqTimelineEditor.vue")['default']>
    'LazyEditorStateNode': LazyComponent<typeof import("../components/editor/animation/StateNode.vue")['default']>
    'LazyEditorTransitionEdge': LazyComponent<typeof import("../components/editor/animation/TransitionEdge.vue")['default']>
    'LazyEditorQaqMaterialNode': LazyComponent<typeof import("../components/editor/blueprint/QaqMaterialNode.vue")['default']>
    'LazyEditorProjectDialog': LazyComponent<typeof import("../components/editor/dialogs/ProjectDialog.vue")['default']>
    'LazyEditorPropertyRenderer': LazyComponent<typeof import("../components/editor/inspector/PropertyRenderer.vue")['default']>
    'LazyEditorQaqTerrainBrushPanel': LazyComponent<typeof import("../components/editor/terrain/QaqTerrainBrushPanel.vue")['default']>
    'LazyEditorQaqTerrainBrushProperties': LazyComponent<typeof import("../components/editor/terrain/QaqTerrainBrushProperties.vue")['default']>
    'LazyEditorQaqTerrainViewport3D': LazyComponent<typeof import("../components/editor/terrain/QaqTerrainViewport3D.vue")['default']>
    'LazyCreateProjectModal': LazyComponent<typeof import("../components/CreateProjectModal.vue")['default']>
    'LazyLanguageSwitcher': LazyComponent<typeof import("../components/LanguageSwitcher.vue")['default']>
    'LazyProjectCard': LazyComponent<typeof import("../components/ProjectCard.vue")['default']>
    'LazyProjectListItem': LazyComponent<typeof import("../components/ProjectListItem.vue")['default']>
    'LazyQaqStatusCheck': LazyComponent<typeof import("../components/QaqStatusCheck.vue")['default']>
    'LazyQaqUserDropdown': LazyComponent<typeof import("../components/QaqUserDropdown.vue")['default']>
    'LazyRenameProjectModal': LazyComponent<typeof import("../components/RenameProjectModal.vue")['default']>
    'LazyTestComponent': LazyComponent<typeof import("../components/TestComponent.vue")['default']>
    'LazyTileMapEditor': LazyComponent<typeof import("../components/TileMapEditor.vue")['default']>
    'LazyUserInfoDebug': LazyComponent<typeof import("../components/UserInfoDebug.vue")['default']>
    'LazyQaqInteractiveElement': LazyComponent<typeof import("../components/ui/QaqInteractiveElement.vue")['default']>
    'LazyQaqMouseFollower': LazyComponent<typeof import("../components/ui/QaqMouseFollower.vue")['default']>
    'LazyUAccordion': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Accordion.vue")['default']>
    'LazyUAlert': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Alert.vue")['default']>
    'LazyUAvatar': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Avatar.vue")['default']>
    'LazyUAvatarGroup': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/AvatarGroup")['default']>
    'LazyUBadge': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Badge.vue")['default']>
    'LazyUButton': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Button.vue")['default']>
    'LazyUButtonGroup': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/ButtonGroup")['default']>
    'LazyUCarousel': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Carousel.vue")['default']>
    'LazyUChip': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Chip.vue")['default']>
    'LazyUDropdown': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Dropdown.vue")['default']>
    'LazyUIcon': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Icon.vue")['default']>
    'LazyUKbd': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Kbd.vue")['default']>
    'LazyULink': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Link.vue")['default']>
    'LazyUMeter': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Meter.vue")['default']>
    'LazyUMeterGroup': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/MeterGroup")['default']>
    'LazyUProgress': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Progress.vue")['default']>
    'LazyUCheckbox': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Checkbox.vue")['default']>
    'LazyUForm': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Form.vue")['default']>
    'LazyUFormGroup': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/FormGroup.vue")['default']>
    'LazyUInput': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Input.vue")['default']>
    'LazyUInputMenu': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/InputMenu.vue")['default']>
    'LazyURadio': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Radio.vue")['default']>
    'LazyURadioGroup': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/RadioGroup.vue")['default']>
    'LazyURange': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Range.vue")['default']>
    'LazyUSelect': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Select.vue")['default']>
    'LazyUSelectMenu': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/SelectMenu.vue")['default']>
    'LazyUTextarea': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Textarea.vue")['default']>
    'LazyUToggle': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Toggle.vue")['default']>
    'LazyUTable': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/data/Table.vue")['default']>
    'LazyUCard': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Card.vue")['default']>
    'LazyUContainer': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Container.vue")['default']>
    'LazyUDivider': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Divider.vue")['default']>
    'LazyUSkeleton': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Skeleton.vue")['default']>
    'LazyUBreadcrumb': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/Breadcrumb.vue")['default']>
    'LazyUCommandPalette': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/CommandPalette.vue")['default']>
    'LazyUCommandPaletteGroup': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/CommandPaletteGroup.vue")['default']>
    'LazyUHorizontalNavigation': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/HorizontalNavigation.vue")['default']>
    'LazyUPagination': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/Pagination.vue")['default']>
    'LazyUTabs': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/Tabs.vue")['default']>
    'LazyUVerticalNavigation': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/VerticalNavigation.vue")['default']>
    'LazyUContextMenu': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/ContextMenu.vue")['default']>
    'LazyUModal': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Modal.vue")['default']>
    'LazyUModals': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Modals.client.vue")['default']>
    'LazyUNotification': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Notification.vue")['default']>
    'LazyUNotifications': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Notifications.vue")['default']>
    'LazyUPopover': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Popover.vue")['default']>
    'LazyUSlideover': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Slideover.vue")['default']>
    'LazyUSlideovers': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Slideovers.client.vue")['default']>
    'LazyUTooltip': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Tooltip.vue")['default']>
    'LazyNuxtWelcome': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/welcome.vue")['default']>
    'LazyNuxtLayout': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
    'LazyNuxtErrorBoundary': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
    'LazyClientOnly': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/client-only")['default']>
    'LazyDevOnly': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/dev-only")['default']>
    'LazyServerPlaceholder': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']>
    'LazyNuxtLink': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-link")['default']>
    'LazyNuxtLoadingIndicator': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
    'LazyNuxtTime': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
    'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
    'LazyNuxtImg': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
    'LazyNuxtPicture': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
    'LazyIcon': LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+icon@1.15.0_magicast@_c650e22a0cdf7094b2a6e1aa08a1c255/node_modules/@nuxt/icon/dist/runtime/components/index")['default']>
    'LazyColorScheme': LazyComponent<typeof import("../node_modules/.pnpm/@nuxtjs+color-mode@3.5.2_magicast@0.3.5/node_modules/@nuxtjs/color-mode/dist/runtime/component.vue3.vue")['default']>
    'LazyNuxtPage': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/pages/runtime/page")['default']>
    'LazyNoScript': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['NoScript']>
    'LazyLink': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Link']>
    'LazyBase': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Base']>
    'LazyTitle': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Title']>
    'LazyMeta': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Meta']>
    'LazyStyle': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Style']>
    'LazyHead': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Head']>
    'LazyHtml': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Html']>
    'LazyBody': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Body']>
    'LazyNuxtIsland': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-island")['default']>
    'LazyUModals': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']>
    'LazyUSlideovers': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']>
    'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export const MaterialQaq3DMaterialPreview: typeof import("../components/editor/material/Qaq3DMaterialPreview.vue")['default']
export const MaterialQaqMaterialEditor: typeof import("../components/editor/material/QaqMaterialEditor.vue")['default']
export const MaterialQaqMaterialNodeProperties: typeof import("../components/editor/material/QaqMaterialNodeProperties.vue")['default']
export const MaterialQaqNodeEditor: typeof import("../components/editor/material/QaqNodeEditor.vue")['default']
export const MaterialQaqVueFlowMaterialEdge: typeof import("../components/editor/material/QaqVueFlowMaterialEdge.vue")['default']
export const MaterialQaqVueFlowMaterialNode: typeof import("../components/editor/material/QaqVueFlowMaterialNode.vue")['default']
export const MaterialOutputNode: typeof import("../components/editor/material/nodes/MaterialOutputNode.vue")['default']
export const MaterialMathNode: typeof import("../components/editor/material/nodes/MathNode.vue")['default']
export const MaterialQaqInputNode: typeof import("../components/editor/material/nodes/QaqInputNode.vue")['default']
export const MaterialQaqMathNode: typeof import("../components/editor/material/nodes/QaqMathNode.vue")['default']
export const MaterialQaqOutputNode: typeof import("../components/editor/material/nodes/QaqOutputNode.vue")['default']
export const MaterialTextureSampleNode: typeof import("../components/editor/material/nodes/TextureSampleNode.vue")['default']
export const NodeQaqInputNode: typeof import("../components/editor/nodes/QaqInputNode.vue")['default']
export const NodeQaqMathNode: typeof import("../components/editor/nodes/QaqMathNode.vue")['default']
export const NodeQaqOutputNode: typeof import("../components/editor/nodes/QaqOutputNode.vue")['default']
export const EditorQaqAxisNavigator: typeof import("../components/editor/3d/QaqAxisNavigator.vue")['default']
export const EditorQaqTransformControls: typeof import("../components/editor/3d/QaqTransformControls.vue")['default']
export const EditorQaqViewportGizmo: typeof import("../components/editor/3d/QaqViewportGizmo.vue")['default']
export const EditorQaqAnimationStateMachine: typeof import("../components/editor/QaqAnimationStateMachine.vue")['default']
export const EditorQaqBlueprintMaterialEditor: typeof import("../components/editor/QaqBlueprintMaterialEditor.vue")['default']
export const EditorQaqBottomPanel: typeof import("../components/editor/QaqBottomPanel.vue")['default']
export const EditorQaqCodeEditor: typeof import("../components/editor/QaqCodeEditor.vue")['default']
export const EditorQaqDraggablePanel: typeof import("../components/editor/QaqDraggablePanel.vue")['default']
export const EditorQaqEditorTabs: typeof import("../components/editor/QaqEditorTabs.vue")['default']
export const EditorQaqFileSystemDock: typeof import("../components/editor/QaqFileSystemDock.vue")['default']
export const EditorQaqInspectorDock: typeof import("../components/editor/QaqInspectorDock.vue")['default']
export const EditorQaqMaterialEditor: typeof import("../components/editor/QaqMaterialEditor.vue")['default']
export const EditorQaqMenuBar: typeof import("../components/editor/QaqMenuBar.vue")['default']
export const EditorQaqMonacoEditor: typeof import("../components/editor/QaqMonacoEditor.vue")['default']
export const EditorQaqNodeEditor: typeof import("../components/editor/QaqNodeEditor.vue")['default']
export const EditorQaqPropertyGroup: typeof import("../components/editor/QaqPropertyGroup.vue")['default']
export const EditorQaqSceneTabs: typeof import("../components/editor/QaqSceneTabs.vue")['default']
export const EditorQaqSceneTreeDock: typeof import("../components/editor/QaqSceneTreeDock.vue")['default']
export const EditorQaqSceneTreeNode: typeof import("../components/editor/QaqSceneTreeNode.vue")['default']
export const EditorQaqSimpleCodeEditor: typeof import("../components/editor/QaqSimpleCodeEditor.vue")['default']
export const EditorQaqTabbedPanel: typeof import("../components/editor/QaqTabbedPanel.vue")['default']
export const EditorQaqTerrainEditor: typeof import("../components/editor/QaqTerrainEditor.vue")['default']
export const EditorQaqTestComponent: typeof import("../components/editor/QaqTestComponent.vue")['default']
export const EditorQaqVSCodeEditor: typeof import("../components/editor/QaqVSCodeEditor.vue")['default']
export const EditorQaqViewport3D: typeof import("../components/editor/QaqViewport3D.vue")['default']
export const EditorQaqVueFlowMaterialEditor: typeof import("../components/editor/QaqVueFlowMaterialEditor.vue")['default']
export const EditorSpriteSheetEditor: typeof import("../components/editor/SpriteSheetEditor.vue")['default']
export const EditorAnimationTreeAdapter: typeof import("../components/editor/animation/AnimationTreeAdapter")['default']
export const EditorEntryNode: typeof import("../components/editor/animation/EntryNode.vue")['default']
export const EditorQaqAnimationEditor: typeof import("../components/editor/animation/QaqAnimationEditor.vue")['default']
export const EditorQaqAnimationParameterPanel: typeof import("../components/editor/animation/QaqAnimationParameterPanel.vue")['default']
export const EditorQaqAnimationTreeEditor: typeof import("../components/editor/animation/QaqAnimationTreeEditor.vue")['default']
export const EditorQaqStateMachineEditor: typeof import("../components/editor/animation/QaqStateMachineEditor.vue")['default']
export const EditorQaqTimelineEditor: typeof import("../components/editor/animation/QaqTimelineEditor.vue")['default']
export const EditorStateNode: typeof import("../components/editor/animation/StateNode.vue")['default']
export const EditorTransitionEdge: typeof import("../components/editor/animation/TransitionEdge.vue")['default']
export const EditorQaqMaterialNode: typeof import("../components/editor/blueprint/QaqMaterialNode.vue")['default']
export const EditorProjectDialog: typeof import("../components/editor/dialogs/ProjectDialog.vue")['default']
export const EditorPropertyRenderer: typeof import("../components/editor/inspector/PropertyRenderer.vue")['default']
export const EditorQaqTerrainBrushPanel: typeof import("../components/editor/terrain/QaqTerrainBrushPanel.vue")['default']
export const EditorQaqTerrainBrushProperties: typeof import("../components/editor/terrain/QaqTerrainBrushProperties.vue")['default']
export const EditorQaqTerrainViewport3D: typeof import("../components/editor/terrain/QaqTerrainViewport3D.vue")['default']
export const CreateProjectModal: typeof import("../components/CreateProjectModal.vue")['default']
export const LanguageSwitcher: typeof import("../components/LanguageSwitcher.vue")['default']
export const ProjectCard: typeof import("../components/ProjectCard.vue")['default']
export const ProjectListItem: typeof import("../components/ProjectListItem.vue")['default']
export const QaqStatusCheck: typeof import("../components/QaqStatusCheck.vue")['default']
export const QaqUserDropdown: typeof import("../components/QaqUserDropdown.vue")['default']
export const RenameProjectModal: typeof import("../components/RenameProjectModal.vue")['default']
export const TestComponent: typeof import("../components/TestComponent.vue")['default']
export const TileMapEditor: typeof import("../components/TileMapEditor.vue")['default']
export const UserInfoDebug: typeof import("../components/UserInfoDebug.vue")['default']
export const QaqInteractiveElement: typeof import("../components/ui/QaqInteractiveElement.vue")['default']
export const QaqMouseFollower: typeof import("../components/ui/QaqMouseFollower.vue")['default']
export const UAccordion: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Accordion.vue")['default']
export const UAlert: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Alert.vue")['default']
export const UAvatar: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Avatar.vue")['default']
export const UAvatarGroup: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/AvatarGroup")['default']
export const UBadge: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Badge.vue")['default']
export const UButton: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Button.vue")['default']
export const UButtonGroup: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/ButtonGroup")['default']
export const UCarousel: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Carousel.vue")['default']
export const UChip: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Chip.vue")['default']
export const UDropdown: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Dropdown.vue")['default']
export const UIcon: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Icon.vue")['default']
export const UKbd: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Kbd.vue")['default']
export const ULink: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Link.vue")['default']
export const UMeter: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Meter.vue")['default']
export const UMeterGroup: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/MeterGroup")['default']
export const UProgress: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Progress.vue")['default']
export const UCheckbox: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Checkbox.vue")['default']
export const UForm: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Form.vue")['default']
export const UFormGroup: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/FormGroup.vue")['default']
export const UInput: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Input.vue")['default']
export const UInputMenu: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/InputMenu.vue")['default']
export const URadio: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Radio.vue")['default']
export const URadioGroup: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/RadioGroup.vue")['default']
export const URange: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Range.vue")['default']
export const USelect: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Select.vue")['default']
export const USelectMenu: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/SelectMenu.vue")['default']
export const UTextarea: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Textarea.vue")['default']
export const UToggle: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Toggle.vue")['default']
export const UTable: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/data/Table.vue")['default']
export const UCard: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Card.vue")['default']
export const UContainer: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Container.vue")['default']
export const UDivider: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Divider.vue")['default']
export const USkeleton: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Skeleton.vue")['default']
export const UBreadcrumb: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/Breadcrumb.vue")['default']
export const UCommandPalette: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/CommandPalette.vue")['default']
export const UCommandPaletteGroup: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/CommandPaletteGroup.vue")['default']
export const UHorizontalNavigation: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/HorizontalNavigation.vue")['default']
export const UPagination: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/Pagination.vue")['default']
export const UTabs: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/Tabs.vue")['default']
export const UVerticalNavigation: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/VerticalNavigation.vue")['default']
export const UContextMenu: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/ContextMenu.vue")['default']
export const UModal: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Modal.vue")['default']
export const UModals: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Modals.client.vue")['default']
export const UNotification: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Notification.vue")['default']
export const UNotifications: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Notifications.vue")['default']
export const UPopover: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Popover.vue")['default']
export const USlideover: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Slideover.vue")['default']
export const USlideovers: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Slideovers.client.vue")['default']
export const UTooltip: typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Tooltip.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtImg: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
export const NuxtPicture: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
export const Icon: typeof import("../node_modules/.pnpm/@nuxt+icon@1.15.0_magicast@_c650e22a0cdf7094b2a6e1aa08a1c255/node_modules/@nuxt/icon/dist/runtime/components/index")['default']
export const ColorScheme: typeof import("../node_modules/.pnpm/@nuxtjs+color-mode@3.5.2_magicast@0.3.5/node_modules/@nuxtjs/color-mode/dist/runtime/component.vue3.vue")['default']
export const NuxtPage: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const UModals: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const USlideovers: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const LazyMaterialQaq3DMaterialPreview: LazyComponent<typeof import("../components/editor/material/Qaq3DMaterialPreview.vue")['default']>
export const LazyMaterialQaqMaterialEditor: LazyComponent<typeof import("../components/editor/material/QaqMaterialEditor.vue")['default']>
export const LazyMaterialQaqMaterialNodeProperties: LazyComponent<typeof import("../components/editor/material/QaqMaterialNodeProperties.vue")['default']>
export const LazyMaterialQaqNodeEditor: LazyComponent<typeof import("../components/editor/material/QaqNodeEditor.vue")['default']>
export const LazyMaterialQaqVueFlowMaterialEdge: LazyComponent<typeof import("../components/editor/material/QaqVueFlowMaterialEdge.vue")['default']>
export const LazyMaterialQaqVueFlowMaterialNode: LazyComponent<typeof import("../components/editor/material/QaqVueFlowMaterialNode.vue")['default']>
export const LazyMaterialOutputNode: LazyComponent<typeof import("../components/editor/material/nodes/MaterialOutputNode.vue")['default']>
export const LazyMaterialMathNode: LazyComponent<typeof import("../components/editor/material/nodes/MathNode.vue")['default']>
export const LazyMaterialQaqInputNode: LazyComponent<typeof import("../components/editor/material/nodes/QaqInputNode.vue")['default']>
export const LazyMaterialQaqMathNode: LazyComponent<typeof import("../components/editor/material/nodes/QaqMathNode.vue")['default']>
export const LazyMaterialQaqOutputNode: LazyComponent<typeof import("../components/editor/material/nodes/QaqOutputNode.vue")['default']>
export const LazyMaterialTextureSampleNode: LazyComponent<typeof import("../components/editor/material/nodes/TextureSampleNode.vue")['default']>
export const LazyNodeQaqInputNode: LazyComponent<typeof import("../components/editor/nodes/QaqInputNode.vue")['default']>
export const LazyNodeQaqMathNode: LazyComponent<typeof import("../components/editor/nodes/QaqMathNode.vue")['default']>
export const LazyNodeQaqOutputNode: LazyComponent<typeof import("../components/editor/nodes/QaqOutputNode.vue")['default']>
export const LazyEditorQaqAxisNavigator: LazyComponent<typeof import("../components/editor/3d/QaqAxisNavigator.vue")['default']>
export const LazyEditorQaqTransformControls: LazyComponent<typeof import("../components/editor/3d/QaqTransformControls.vue")['default']>
export const LazyEditorQaqViewportGizmo: LazyComponent<typeof import("../components/editor/3d/QaqViewportGizmo.vue")['default']>
export const LazyEditorQaqAnimationStateMachine: LazyComponent<typeof import("../components/editor/QaqAnimationStateMachine.vue")['default']>
export const LazyEditorQaqBlueprintMaterialEditor: LazyComponent<typeof import("../components/editor/QaqBlueprintMaterialEditor.vue")['default']>
export const LazyEditorQaqBottomPanel: LazyComponent<typeof import("../components/editor/QaqBottomPanel.vue")['default']>
export const LazyEditorQaqCodeEditor: LazyComponent<typeof import("../components/editor/QaqCodeEditor.vue")['default']>
export const LazyEditorQaqDraggablePanel: LazyComponent<typeof import("../components/editor/QaqDraggablePanel.vue")['default']>
export const LazyEditorQaqEditorTabs: LazyComponent<typeof import("../components/editor/QaqEditorTabs.vue")['default']>
export const LazyEditorQaqFileSystemDock: LazyComponent<typeof import("../components/editor/QaqFileSystemDock.vue")['default']>
export const LazyEditorQaqInspectorDock: LazyComponent<typeof import("../components/editor/QaqInspectorDock.vue")['default']>
export const LazyEditorQaqMaterialEditor: LazyComponent<typeof import("../components/editor/QaqMaterialEditor.vue")['default']>
export const LazyEditorQaqMenuBar: LazyComponent<typeof import("../components/editor/QaqMenuBar.vue")['default']>
export const LazyEditorQaqMonacoEditor: LazyComponent<typeof import("../components/editor/QaqMonacoEditor.vue")['default']>
export const LazyEditorQaqNodeEditor: LazyComponent<typeof import("../components/editor/QaqNodeEditor.vue")['default']>
export const LazyEditorQaqPropertyGroup: LazyComponent<typeof import("../components/editor/QaqPropertyGroup.vue")['default']>
export const LazyEditorQaqSceneTabs: LazyComponent<typeof import("../components/editor/QaqSceneTabs.vue")['default']>
export const LazyEditorQaqSceneTreeDock: LazyComponent<typeof import("../components/editor/QaqSceneTreeDock.vue")['default']>
export const LazyEditorQaqSceneTreeNode: LazyComponent<typeof import("../components/editor/QaqSceneTreeNode.vue")['default']>
export const LazyEditorQaqSimpleCodeEditor: LazyComponent<typeof import("../components/editor/QaqSimpleCodeEditor.vue")['default']>
export const LazyEditorQaqTabbedPanel: LazyComponent<typeof import("../components/editor/QaqTabbedPanel.vue")['default']>
export const LazyEditorQaqTerrainEditor: LazyComponent<typeof import("../components/editor/QaqTerrainEditor.vue")['default']>
export const LazyEditorQaqTestComponent: LazyComponent<typeof import("../components/editor/QaqTestComponent.vue")['default']>
export const LazyEditorQaqVSCodeEditor: LazyComponent<typeof import("../components/editor/QaqVSCodeEditor.vue")['default']>
export const LazyEditorQaqViewport3D: LazyComponent<typeof import("../components/editor/QaqViewport3D.vue")['default']>
export const LazyEditorQaqVueFlowMaterialEditor: LazyComponent<typeof import("../components/editor/QaqVueFlowMaterialEditor.vue")['default']>
export const LazyEditorSpriteSheetEditor: LazyComponent<typeof import("../components/editor/SpriteSheetEditor.vue")['default']>
export const LazyEditorAnimationTreeAdapter: LazyComponent<typeof import("../components/editor/animation/AnimationTreeAdapter")['default']>
export const LazyEditorEntryNode: LazyComponent<typeof import("../components/editor/animation/EntryNode.vue")['default']>
export const LazyEditorQaqAnimationEditor: LazyComponent<typeof import("../components/editor/animation/QaqAnimationEditor.vue")['default']>
export const LazyEditorQaqAnimationParameterPanel: LazyComponent<typeof import("../components/editor/animation/QaqAnimationParameterPanel.vue")['default']>
export const LazyEditorQaqAnimationTreeEditor: LazyComponent<typeof import("../components/editor/animation/QaqAnimationTreeEditor.vue")['default']>
export const LazyEditorQaqStateMachineEditor: LazyComponent<typeof import("../components/editor/animation/QaqStateMachineEditor.vue")['default']>
export const LazyEditorQaqTimelineEditor: LazyComponent<typeof import("../components/editor/animation/QaqTimelineEditor.vue")['default']>
export const LazyEditorStateNode: LazyComponent<typeof import("../components/editor/animation/StateNode.vue")['default']>
export const LazyEditorTransitionEdge: LazyComponent<typeof import("../components/editor/animation/TransitionEdge.vue")['default']>
export const LazyEditorQaqMaterialNode: LazyComponent<typeof import("../components/editor/blueprint/QaqMaterialNode.vue")['default']>
export const LazyEditorProjectDialog: LazyComponent<typeof import("../components/editor/dialogs/ProjectDialog.vue")['default']>
export const LazyEditorPropertyRenderer: LazyComponent<typeof import("../components/editor/inspector/PropertyRenderer.vue")['default']>
export const LazyEditorQaqTerrainBrushPanel: LazyComponent<typeof import("../components/editor/terrain/QaqTerrainBrushPanel.vue")['default']>
export const LazyEditorQaqTerrainBrushProperties: LazyComponent<typeof import("../components/editor/terrain/QaqTerrainBrushProperties.vue")['default']>
export const LazyEditorQaqTerrainViewport3D: LazyComponent<typeof import("../components/editor/terrain/QaqTerrainViewport3D.vue")['default']>
export const LazyCreateProjectModal: LazyComponent<typeof import("../components/CreateProjectModal.vue")['default']>
export const LazyLanguageSwitcher: LazyComponent<typeof import("../components/LanguageSwitcher.vue")['default']>
export const LazyProjectCard: LazyComponent<typeof import("../components/ProjectCard.vue")['default']>
export const LazyProjectListItem: LazyComponent<typeof import("../components/ProjectListItem.vue")['default']>
export const LazyQaqStatusCheck: LazyComponent<typeof import("../components/QaqStatusCheck.vue")['default']>
export const LazyQaqUserDropdown: LazyComponent<typeof import("../components/QaqUserDropdown.vue")['default']>
export const LazyRenameProjectModal: LazyComponent<typeof import("../components/RenameProjectModal.vue")['default']>
export const LazyTestComponent: LazyComponent<typeof import("../components/TestComponent.vue")['default']>
export const LazyTileMapEditor: LazyComponent<typeof import("../components/TileMapEditor.vue")['default']>
export const LazyUserInfoDebug: LazyComponent<typeof import("../components/UserInfoDebug.vue")['default']>
export const LazyQaqInteractiveElement: LazyComponent<typeof import("../components/ui/QaqInteractiveElement.vue")['default']>
export const LazyQaqMouseFollower: LazyComponent<typeof import("../components/ui/QaqMouseFollower.vue")['default']>
export const LazyUAccordion: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Accordion.vue")['default']>
export const LazyUAlert: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Alert.vue")['default']>
export const LazyUAvatar: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Avatar.vue")['default']>
export const LazyUAvatarGroup: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/AvatarGroup")['default']>
export const LazyUBadge: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Badge.vue")['default']>
export const LazyUButton: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Button.vue")['default']>
export const LazyUButtonGroup: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/ButtonGroup")['default']>
export const LazyUCarousel: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Carousel.vue")['default']>
export const LazyUChip: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Chip.vue")['default']>
export const LazyUDropdown: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Dropdown.vue")['default']>
export const LazyUIcon: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Icon.vue")['default']>
export const LazyUKbd: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Kbd.vue")['default']>
export const LazyULink: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Link.vue")['default']>
export const LazyUMeter: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Meter.vue")['default']>
export const LazyUMeterGroup: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/MeterGroup")['default']>
export const LazyUProgress: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/elements/Progress.vue")['default']>
export const LazyUCheckbox: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Checkbox.vue")['default']>
export const LazyUForm: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Form.vue")['default']>
export const LazyUFormGroup: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/FormGroup.vue")['default']>
export const LazyUInput: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Input.vue")['default']>
export const LazyUInputMenu: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/InputMenu.vue")['default']>
export const LazyURadio: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Radio.vue")['default']>
export const LazyURadioGroup: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/RadioGroup.vue")['default']>
export const LazyURange: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Range.vue")['default']>
export const LazyUSelect: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Select.vue")['default']>
export const LazyUSelectMenu: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/SelectMenu.vue")['default']>
export const LazyUTextarea: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Textarea.vue")['default']>
export const LazyUToggle: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/forms/Toggle.vue")['default']>
export const LazyUTable: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/data/Table.vue")['default']>
export const LazyUCard: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Card.vue")['default']>
export const LazyUContainer: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Container.vue")['default']>
export const LazyUDivider: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Divider.vue")['default']>
export const LazyUSkeleton: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/layout/Skeleton.vue")['default']>
export const LazyUBreadcrumb: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/Breadcrumb.vue")['default']>
export const LazyUCommandPalette: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/CommandPalette.vue")['default']>
export const LazyUCommandPaletteGroup: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/CommandPaletteGroup.vue")['default']>
export const LazyUHorizontalNavigation: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/HorizontalNavigation.vue")['default']>
export const LazyUPagination: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/Pagination.vue")['default']>
export const LazyUTabs: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/Tabs.vue")['default']>
export const LazyUVerticalNavigation: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/navigation/VerticalNavigation.vue")['default']>
export const LazyUContextMenu: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/ContextMenu.vue")['default']>
export const LazyUModal: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Modal.vue")['default']>
export const LazyUModals: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Modals.client.vue")['default']>
export const LazyUNotification: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Notification.vue")['default']>
export const LazyUNotifications: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Notifications.vue")['default']>
export const LazyUPopover: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Popover.vue")['default']>
export const LazyUSlideover: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Slideover.vue")['default']>
export const LazyUSlideovers: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Slideovers.client.vue")['default']>
export const LazyUTooltip: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+ui@2.22.0_jwt-decode@_83d94c6f26314d1f4f0e334040a3323a/node_modules/@nuxt/ui/dist/runtime/components/overlays/Tooltip.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
export const LazyIcon: LazyComponent<typeof import("../node_modules/.pnpm/@nuxt+icon@1.15.0_magicast@_c650e22a0cdf7094b2a6e1aa08a1c255/node_modules/@nuxt/icon/dist/runtime/components/index")['default']>
export const LazyColorScheme: LazyComponent<typeof import("../node_modules/.pnpm/@nuxtjs+color-mode@3.5.2_magicast@0.3.5/node_modules/@nuxtjs/color-mode/dist/runtime/component.vue3.vue")['default']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/nuxt-island")['default']>
export const LazyUModals: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyUSlideovers: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/.pnpm/nuxt@3.17.7_@netlify+blobs@_fd40ed30f60fc2c030bafd6fd83870f7/node_modules/nuxt/dist/app/components/server-placeholder")['default']>

export const componentNames: string[]
