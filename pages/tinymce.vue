<template>
	<main>
		<TinyMCE v-if="status === 'success'" id="id" :image-max-size="2" :image-types="imageTypes" :disabled="disabled" :initial-data="data!" resize="vertical" :saveHandler="saveHandler" :uploadImageHandler="uploadImageHandler" />
	</main>
</template>

<script setup lang="ts">
	import { Editor } from 'tinymce'
	const disabled = ref(false)
	const imageTypes = ['image/jpeg', 'image/jpg', 'image/gif', 'image/png', 'image/apng', 'image/tiff']

	const { data, status, error } = await useLazyFetch<string>('/api/data', { responseType: 'text' })
	watchEffect(() => {
		if (error.value) showError(error.value)
	})

	async function saveHandler(editor: Editor) {
		editor.notificationManager.close()
		editor.notificationManager.open({ text: 'Saving data. Please wait.', type: 'info' })
		disabled.value = true

		try {
			await $fetch('/api/data', {
				method: 'POST',
				headers: { 'content-type': 'text' },
				body: editor.getContent()
			})
			disabled.value = false
			editor.notificationManager.close()
			editor.notificationManager.open({ text: 'Saved successfully', type: 'success', timeout: 2000 })
		} catch (e) {
			disabled.value = false
			editor.notificationManager.close()
			editor.notificationManager.open({ text: 'Failed to save', type: 'error', timeout: 2000 })
		}
	}

	async function uploadImageHandler(blob: Blob, progressFn: (value: number) => void, res: (value: string) => void, rej: (reason: { message: string; remove: true }) => void) {
		const resolve = (value: string) => {
			disabled.value = false
			res(value)
		}
		const reject = (reason: { message: string; remove: true }) => {
			disabled.value = false
			rej(reason)
		}
		try {
			const xhr = new XMLHttpRequest()
			xhr.withCredentials = false
			xhr.open('PUT', '/api/upload_image')
			xhr.upload.onprogress = e => {
				if (e.lengthComputable) progressFn(Math.trunc((e.loaded / e.total) * 100))
			}
			xhr.onload = () => {
				if (xhr.status < 200 || xhr.status >= 300) return reject({ message: `Status code ${xhr.status}.`, remove: true })

				let json = undefined
				try {
					json = JSON.parse(xhr.responseText)
				} catch {
					return reject({ message: 'Invalid response received.', remove: true })
				}
				if (!json?.link || typeof json.link !== 'string') return reject({ message: 'Image link not found.', remove: true })

				resolve(json.link)
			}
			xhr.onerror = () => {
				return reject({ message: 'Network error occurred during image upload.', remove: true })
			}

			xhr.send(
				(() => {
					disabled.value = true
					const formData = new FormData()
					formData.append('image', blob)
					return formData
				})()
			)
		} catch (e) {
			return reject({ message: 'Some errors have occured', remove: true })
		}
	}
</script>
