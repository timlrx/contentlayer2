import * as path from 'node:path'

import * as core from '@contentlayer2/core'
import { fs } from '@contentlayer2/utils'
import { OT, pipe, T } from '@contentlayer2/utils/effect'

import { BaseCommand } from './_BaseCommand.js'

export class PostInstallCommand extends BaseCommand {
  static paths = [['postinstall']]

  executeSafe = () => {
    const { configPath, external } = this
    return pipe(
      T.gen(function* ($) {
        const artifactsDirPath = yield* $(core.ArtifactsDir.mkdir)

        yield* $(
          generateTypes({
            artifactsDirPath,
            moduleName: 'generated',
            configOptions: { configPath, esbuildOptions: { external } },
          }),
        )

        yield* $(addToplevelDotpkgToGitignore())
      }),
      OT.withSpan('@contentlayer2/cli/commands/PostInstallCommand:executeSafe', {
        attributes: { cwd: process.cwd() },
      }),
    )
  }
}

// TODO unify this implementation with `generateDotpkg`
const generateTypes = ({
  artifactsDirPath,
  moduleName,
  configOptions,
}: {
  artifactsDirPath: string
  moduleName: string
  configOptions: Parameters<typeof core.getConfig>[0]
}) =>
  T.gen(function* ($) {
    const dirPath = path.join(artifactsDirPath, moduleName)
    const dirExists = yield* $(fs.fileOrDirExists(dirPath))
    if (!dirExists) {
      yield* $(fs.mkdirp(dirPath))
    }

    const indexDtsFilePath = path.join(dirPath, 'index.d.ts')
    const indexDtsFileExists = yield* $(fs.fileOrDirExists(indexDtsFilePath))

    const typesDtsFilePath = path.join(dirPath, 'types.d.ts')
    const typesDtsFileExists = yield* $(fs.fileOrDirExists(typesDtsFilePath))

    if (indexDtsFileExists && typesDtsFileExists) return

    const sourceEither = yield* $(pipe(core.getConfig(configOptions), T.either))
    if (sourceEither._tag === 'Left') {
      if (sourceEither.left._tag === 'NoConfigFoundError') {
        yield* $(fs.writeFile(indexDtsFilePath, moduleStubFileIndexDts))
        return
      } else {
        return yield* $(T.fail(sourceEither.left))
      }
    }

    const { source, esbuildHash } = sourceEither.right
    const schemaDef = yield* $(source.provideSchema(esbuildHash))

    if (!indexDtsFileExists) {
      const options = source.options
      yield* $(fs.writeFile(indexDtsFilePath, core.makeDataTypes({ schemaDef, options })))
    }

    if (!typesDtsFileExists) {
      const generationOptions = { sourcePluginType: source.type, options: source.options }
      yield* $(fs.writeFile(typesDtsFilePath, core.renderTypes({ schemaDef, generationOptions })))
    }
  })

const moduleStubFileIndexDts = `\
// This file is automatically generated by the Contentlayer.
// This is a placeholder until \`contentlayer build\` has been run.

export {}
`

const addToplevelDotpkgToGitignore = () =>
  T.gen(function* ($) {
    const cwd = yield* $(core.getCwd)
    const gitignoreFilePath = path.join(cwd, '.gitignore')
    const gitignoreExists = yield* $(fs.fileOrDirExists(gitignoreFilePath))
    if (gitignoreExists) {
      const gitignoreContent = yield* $(fs.readFile(gitignoreFilePath))

      if (!gitignoreContent.includes('.contentlayer')) {
        const newGitignoreContent = `\
${gitignoreContent}

# Contentlayer
.contentlayer
`

        yield* $(fs.writeFile(gitignoreFilePath, newGitignoreContent))
      }
    }
  })
