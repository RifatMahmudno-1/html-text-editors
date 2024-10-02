<template>
	<main>
		<div id="editor"></div>
	</main>
</template>

<script setup>
	const editor = ref(null)
	const getData = () => editor.value.html.get()
	const setData = d => editor.value.html.set(d)
	const disabled = ref(false)

	onMounted(() => {
		new FroalaEditor('#editor', {
			language: 'en',
			attribution: false,
			iframe: true,
			events: {
				initialized: function () {
					editor.value = markRaw(this)
					if (disabled.value) editor.value.edit.off()
					else editor.value.edit.on()
				}
			}
		})
	})

	onBeforeUnmount(() => {
		editor.value?.destroy()
	})

	watch(disabled, () => {
		if (disabled.value) editor.value?.edit.off()
		else editor.value?.edit.on()
	})
</script>
