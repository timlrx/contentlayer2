import { promises as fsp } from 'node:fs'
import * as path from 'node:path'

import type { HasCwd } from '@contentlayer2/core'
import { getConfig, provideCwd } from '@contentlayer2/core'
import type { fs } from '@contentlayer2/utils'
import { provideJaegerTracing, recRemoveUndefinedValues } from '@contentlayer2/utils'
import type { HasConsole } from '@contentlayer2/utils/effect'
import { OT, pipe, pretty, provideConsole, T } from '@contentlayer2/utils/effect'
import { NodeFsLive } from '@contentlayer2/utils/node'
import { Command, Option } from 'clipanion'
import * as t from 'typanion'

import type { Transform } from '../lib/index.js'
import { convertSchema } from './convert.js'
import { toYamlString } from './utils.js'

const defaultStackbitYamlPath = () => `${path.join(process.cwd())}/stackbit.yaml`
const defaultTransformPath = () => `${path.join(process.cwd())}/contentlayer-stackbit-yaml-generator.js`

export class DefaultCommand extends Command {
  configPath = Option.String('-c,--config', 'contentlayer.config.ts', {
    description: 'Path to the Contentlayer config',
    validator: t.isString(),
  })

  stackbitYamlPath = Option.String('-s,--stackbit', defaultStackbitYamlPath(), {
    description: 'Target path for Stackbit YAML file',
    validator: t.isString(),
  })

  transformPath = Option.String('-t,--transform', defaultTransformPath(), {
    description:
      'Path to a "transform file" which allows you to transform the derived Stackbit config before generating the output file',
    validator: t.isString(),
  })

  external = Option.String('--external', {
    description: 'External dependencies to exclude from the config bundle',
    validator: t.isArray(t.isString()),
    required: false,
  })

  // TODO refactor similar to `@contentlayer2/cli`
  async execute() {
    try {
      await pipe(
        this.executeSafe(),
        provideJaegerTracing('contentlayer-stackbit-yaml-generator'),
        T.tapCause((cause) => T.die(pretty(cause))),
        provideCwd,
        provideConsole,
        T.provideSomeLayer(NodeFsLive),
        T.runPromise,
      )
    } catch (e: any) {
      console.error(e)
      throw e
    }
  }

  executeSafe = (): T.Effect<OT.HasTracer & HasCwd & HasConsole & fs.HasFs, unknown, void> =>
    pipe(
      getConfig({ configPath: this.configPath, esbuildOptions: { external: this.external } }),
      T.chain((config) =>
        T.struct({ source: T.succeed(config.source), schema: config.source.provideSchema(config.esbuildHash) }),
      ),
      T.chain(({ schema, source }) =>
        T.tryCatchPromise(
          async () => {
            let stackbitConfig = convertSchema(schema, source.extensions)
            recRemoveUndefinedValues(stackbitConfig)

            const transform = await getTransform(this.transformPath)
            if (transform) {
              stackbitConfig = transform(stackbitConfig)
            }

            const yamlContent = `\
# This file is generated by Contentlayer

${toYamlString(stackbitConfig)}
`

            await fsp.writeFile(this.stackbitYamlPath, yamlContent)
            console.log(`Stackbit config generated to ${this.stackbitYamlPath}`)
          },
          (error) => error,
        ),
      ),
      OT.withSpan('DefaultCommand:executeSafe'),
    )
}

const getTransform = async (transformPath: string): Promise<undefined | Transform> => {
  const transformFileExists = await fileOrDirExists(transformPath)
  if (!transformFileExists) {
    return undefined
  }

  const transform = require(transformPath)

  if (typeof transform !== 'function') {
    throw new Error(`Transform file "${transformPath}" doesn't export a function`)
  }

  return transform
}

const fileOrDirExists = async (filePath: string): Promise<boolean> => {
  try {
    const stat = await fsp.stat(filePath)
    return stat.isFile() || stat.isDirectory()
  } catch (e: any) {
    return false
  }
}
