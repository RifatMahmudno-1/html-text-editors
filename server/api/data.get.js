export default defineEventHandler(async ev => {
	const { req, res } = modifyH3(ev)
	try {
		const data = await useStorage().getItem('kvdb:tinymce')
		return res.send(data || '', 'text')
	} catch (e) {
		console.log(e)
		return res.sendStatus(500)
	}
})
