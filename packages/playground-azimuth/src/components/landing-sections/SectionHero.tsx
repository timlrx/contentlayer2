import { section_hero } from '.contentlayer'
import React, { FC } from 'react'
import { markdownify, withPrefix } from '../../utils'
import { CtaButtons } from './CtaButtons'

export const SectionHero: FC<{ section: section_hero }> = ({ section }) => {
  return (
    <section id={section.section_id} className="block hero-block bg-accent outer">
      <div className="inner">
        <div className="grid">
          {section.image && (
            <div className="cell block-preview">
              <img src={withPrefix(section.image)} alt={section.image_alt} />
            </div>
          )}
          <div className="cell block-content">
            {section.title && <h2 className="block-title underline">{section.title}</h2>}
            <div className="block-copy">{markdownify(section.content)}</div>
            {section.actions && (
              <div className="block-buttons">
                <CtaButtons actions={section.actions} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
