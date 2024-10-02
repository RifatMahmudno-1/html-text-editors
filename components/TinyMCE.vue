<template>
	<div class="__tinymce_con__" :style="`resize: ${props.resize};`">
		<div class="__tinymce_loading__" v-if="!editor">Loading...</div>
		<div class="__tinymce__" :style="`visibility:${editor ? 'visible' : 'hidden'};`">
			<div :id="props.id"></div>
		</div>
	</div>
</template>

<style scoped>
	.__tinymce_con__ {
		position: relative;
		min-height: 20rem;
		height: 100%;
		overflow: hidden;
	}
	.__tinymce_loading__ {
		position: absolute;
		inset: 0;
		display: grid;
		align-items: center;
		justify-items: center;
	}
	.__tinymce__ {
		position: absolute;
		inset: 0;
	}
</style>

<script setup lang="ts">
	import tinymce, { type Editor } from 'tinymce'
	const props = withDefaults(
		defineProps<{
			id: string
			imageTypes?: string[]
			imageMaxSize?: number
			initialData?: string
			disabled?: boolean
			resize?: 'none' | 'horizontal' | 'both' | 'vertical'
			saveHandler: (editor: Editor) => Promise<void>
			uploadImageHandler?: (image: Blob, progressFn: (n: number) => void, resolve: (value: string) => void, reject: (value: { message: string; remove: true }) => void) => Promise<void>
		}>(),
		{
			initialData: '',
			resize: 'none',
			disabled: false
		}
	)

	const editor = ref<null | Editor>(null)

	function editorInit() {
		// tinymce.init({
		// 	license_key: 'gpl',
		// 	suffix: '.min',
		// 	selector: `#${props.id}`,
		// 	height: '100%',
		// 	width: '100%',
		// 	resize: false,
		// 	readonly: true,
		// 	toolbar: false,
		// 	menubar: false,
		// 	statusbar: false,
		// 	skin: 'oxide',
		// 	content_css: 'default',
		// 	branding: false,
		// 	promotion: false,
		// 	base_url: `https://cdn.jsdelivr.net/npm/tinymce@${tinymce.majorVersion}.${tinymce.minorVersion}`,
		// 	plugins: ['codesample'],
		// 	setup: ed => {
		// 		ed.on('init', () => {
		// 			editor.value = markRaw(ed)
		// 			if (props.initialData) ed.setContent(props.initialData)
		// 		})
		// 	}
		// })
		// return
		tinymce.init({
			license_key: 'gpl',
			suffix: '.min',
			selector: `#${props.id}`,
			height: '100%',
			width: '100%',
			resize: false,
			plugins: ['save', 'preview', 'searchreplace', 'directionality', 'code', 'visualblocks', 'visualchars', 'fullscreen', 'image', 'link', 'media', 'codesample', 'table', 'charmap', 'nonbreaking', 'anchor', 'insertdatetime', 'advlist', 'lists', 'wordcount', 'help', 'charmap', 'emoticons', 'accordion'],
			toolbar: [
				{ name: undefined, items: ['save', 'undo', 'redo'] },
				{ name: undefined, items: ['accordion', 'accordionremove'] },
				{ name: undefined, items: ['blocks', 'fontfamily', 'fontsize'] },
				{ name: undefined, items: ['bold', 'italic', 'underline', 'strikethrough'] },
				{ name: undefined, items: ['align', 'numlist', 'bullist', 'table'] },
				{ name: undefined, items: ['link', 'image', 'media'] },
				{ name: undefined, items: ['lineheight', 'outdent', 'indent'] },
				{ name: undefined, items: ['forecolor', 'backcolor', 'removeformat'] },
				{ name: undefined, items: ['charmap', 'emoticons'] },
				{ name: undefined, items: ['code', 'fullscreen', 'preview', 'print'] },
				{ name: undefined, items: ['anchor', 'codesample'] },
				{ name: undefined, items: ['ltr', 'rtl'] }
			],
			toolbar_mode: 'sliding',
			menubar: true,
			skin: 'oxide',
			content_css: 'default',
			branding: false,
			promotion: false,
			contextmenu: ['link', 'bold', 'italic', 'underline'],
			browser_spellcheck: true,
			// content_style: 'body{font-family:Helvetica,Arial,sans-serif; font-size:16px}',
			base_url: `https://cdn.jsdelivr.net/npm/tinymce@${tinymce.majorVersion}.${tinymce.minorVersion}`,
			readonly: props.disabled,
			a11y_advanced_options: true,
			image_caption: true,
			image_advtab: true,
			image_title: true,

			...(() => {
				if (!props.uploadImageHandler) return {}
				return {
					automatic_uploads: true,
					images_upload_handler: (blobInfo, progressFn) =>
						new Promise(async (res, rej) => {
							try {
								const blob = blobInfo.blob()

								if (props.imageTypes && !props.imageTypes.includes(blob.type)) return rej({ message: 'Image not supported', remove: true })
								if (props.imageMaxSize && blob.size / 1_000_000 > props.imageMaxSize) return rej({ message: `Image size should be less than ${props.imageMaxSize}MB`, remove: true })

								await props.uploadImageHandler!(blob, progressFn, res, rej)
							} catch (e) {
								return rej({ message: 'Some errors have occured', remove: true })
							}
						}),
					file_picker_types: 'image',
					file_picker_callback: callback => {
						const input = globalThis.document.createElement('input')
						input.setAttribute('type', 'file')
						input.setAttribute('accept', props.imageTypes ? props.imageTypes.join(',') : 'image/*')
						input.addEventListener(
							'change',
							e => {
								const file = (e.target as HTMLInputElement)!.files![0]

								if (props.imageTypes && !props.imageTypes.includes(file.type)) {
									editor.value!.windowManager.alert('Image not supported')
									return
								}
								if (props.imageMaxSize && file.size / 1_000_000 > props.imageMaxSize) {
									editor.value!.windowManager.alert(`Image size should be less than ${props.imageMaxSize}MB`)
									return
								}

								const reader = new FileReader()
								reader.addEventListener('load', () => {
									const id = 'blobid' + new Date().getTime()
									const blobCache = editor.value!.editorUpload.blobCache
									const base64 = (reader.result as string).split(',')[1]
									const blobInfo = blobCache.create(id, file, base64)
									blobCache.add(blobInfo)
									callback(blobInfo.blobUri(), { title: file.name })
								})
								reader.readAsDataURL(file)
							},
							{ once: true }
						)

						input.click()
						input.remove()
					}
				}
			})(),
			save_onsavecallback: () => props.saveHandler(editor.value as Editor),
			setup: ed => {
				ed.on('init', () => {
					editor.value = markRaw(ed)
					if (props.initialData) ed.setContent(props.initialData)
				})
				ed.on('drop', event => {
					const files = event.dataTransfer?.files
					if (files && files.length > 1) {
						event.preventDefault()
						ed.notificationManager.open({ text: 'You can only drop one file at a time.', type: 'error' })
					}
				})
				ed.on('paste', ev => {
					if (!ev.clipboardData?.files) return

					if (ev.clipboardData.files.length > 1) {
						ev.preventDefault()
						ed.notificationManager.open({ text: 'You can only paste one file at a time.', type: 'error' })
					}
				})
			}
		})
	}

	function editorRemove() {
		editor.value?.destroy()
		editor.value = null
	}

	onMounted(editorInit)
	onBeforeUnmount(editorRemove)

	watch(
		() => props.disabled,
		() => {
			if (props.disabled) editor.value!.mode.set('readonly')
			else editor.value!.mode.set('design')
		}
	)
	Object.keys(props).forEach(e => {
		const el = e as keyof typeof props
		if (['disabled', 'resize'].includes(el)) return
		watch(
			() => props[el],
			() => {
				editorRemove()
				editorInit()
			}
		)
	})
</script>
