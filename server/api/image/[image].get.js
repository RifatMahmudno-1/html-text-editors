import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createReadStream, existsSync, statSync, mkdir } from 'node:fs'

export default defineEventHandler(async ev => {
	const { req, res } = modifyH3(ev)
	try {
		const dir = join(tmpdir(), './editor')
		if (!existsSync(dir) || !statSync(dir).isDirectory) mkdir(dir, { recursive: true })

		const path = join(dir, './' + req.getParams().image)
		if (!existsSync(path) || !statSync(path).isFile) return res.sendStatus(404)

		return res.stream(createReadStream(path))
	} catch (e) {
		console.log(e)
		return res.sendStatus(500)
	}
})
