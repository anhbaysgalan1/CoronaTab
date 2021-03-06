import { Component, HTMLAttributes } from 'react'
import { inject, observer } from 'mobx-react'
import { AppStore } from '../pages/_app.store'
import { Google } from '../utils/google'
import ExternalLinkSvg from '../../public/icons/external-link.svg'

interface Props extends HTMLAttributes<HTMLAnchorElement> {
  logoClassName?: string
  appStore?: AppStore
}

@inject('appStore')
@observer
export class ExtensionDownloadBtnComponent extends Component<Props> {
  render () {
    const {
      appStore,
      logoClassName,
      children,
      className = '',
      ...props
    } = this.props

    const { browserExtension, t } = appStore

    return typeof window !== 'undefined'
      ? (
        <a
          href={browserExtension.url}
          onClick={() => Google.pushGTMEvent('Extension:DownloadClickout')}
          target="_blank"
          className={`btn flex min-w-0 items-center ${className}`}
          {...props}
        >
          {
            children ?? (
              <>
                <img className={logoClassName} src={`/browser-logos/${browserExtension.name.toLowerCase()}.png`}/>
                <span className="mr-2 truncate">
                  {t('download')} {browserExtension.name} {t('extension')}
                </span>
                <ExternalLinkSvg className="h-line-sm" />
              </>
            )
          }
        </a>
      )
      : ''
  }
}
