import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { writeFileSync, statSync, existsSync, mkdir } from 'node:fs'

export default defineEventHandler(async ev => {
	const { req, res } = modifyH3(ev)
	try {
		const form = await req.parseForm()
		const filename = globalThis.crypto.randomUUID() + encodeURIComponent(form.files.image.filename)

		const dir = join(tmpdir(), './editor')
		if (!existsSync(dir) || !statSync(dir).isDirectory) mkdir(dir, { recursive: true })

		writeFileSync(join(dir, './' + filename), form.files.image.buffer)

		return res.send({ link: '/api/image/' + filename })
	} catch (e) {
		console.log(e)
		return res.sendStatus(500)
	}
})
