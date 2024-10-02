export default defineEventHandler(async ev => {
	const { req, res } = modifyH3(ev)
	try {
		const body = await req.parseBody()
		await useStorage().setItem('kvdb:tinymce', body)
		return res.sendEmpty()
	} catch (e) {
		console.log(e)
		return res.sendStatus(500)
	}
})
