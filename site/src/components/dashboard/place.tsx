import { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { AppStore } from '../../pages/_app.store'
import { DashboardPageStore, Place, LoadingStatus } from '../../pages/dashboard.store'
import { DashboardCumulativeGraphComponent } from './visualizations/cumulative-graph'
import { DashboardDailyChartComponent } from './visualizations/daily-chart'
import { DashboardStatsComponent } from './stats'
import { LoadingComponent } from '../loading'
import { DashboardCompareGraphComponent } from './visualizations/compare-graph'
import { TypeaheadSelectInputComponent } from '../inputs/select/typeahead'

interface Props {
  appStore?: AppStore,
  pageStore?: DashboardPageStore
}

interface State {
  selectedPlace: Place
  data: {
    raw?: any,
    cumulativeSeries?: any,
    dailySeries?: any
    projectedCumulativeSeries?: any
    projectedDailySeries?: any
  }
  loadingStatus: LoadingStatus
  ignoreLoadingStatus: boolean
}

@inject('appStore', 'pageStore')
@observer
export class DashboardPlaceComponent extends Component<Props, State> {
  state: State = (() => {
    const selectedPlace = this.props.pageStore.selectedPlace
    let data = {}
    if (this.props.pageStore.selectedPlace) {
      const rawData = this.props.pageStore.rawPlaceData?.[this.props.pageStore.selectedPlace.id]
      if (rawData) {
        data = {
          raw: rawData.data,
          cumulativeSeries: DashboardPageStore.parseCumulativeSeriesData(rawData.data),
          dailySeries: DashboardPageStore.calcDailySeriesData(rawData.data),
          projectedCumulativeSeries: DashboardPageStore.parseCumulativeSeriesData(rawData.projected),
          projectedDailySeries: DashboardPageStore.calcDailySeriesData(rawData.projected)
        }
      }
    }
    return {
      selectedPlace,
      data,
      loadingStatus: LoadingStatus.IS_IDLE,
      ignoreLoadingStatus: Object.keys(data).length > 0
    }
  })()

  componentDidMount () {
    if (this.props.pageStore.selectedPlace) {
      this.fetchAndSetData()
    }
  }

  componentDidUpdate (prevProps: Props) {
    const { pageStore } = this.props
    if (this.state.selectedPlace?.id !== pageStore.selectedPlace?.id) {
      this.setState({ selectedPlace: pageStore.selectedPlace })
      if (pageStore.selectedPlace) {
        this.fetchAndSetData()
      } else {
        this.setState({ data: {} })
      }
    }
  }

  fetchAndSetData = async () => {
    try {
      if (!this.state.ignoreLoadingStatus) {
        this.setState({ loadingStatus: LoadingStatus.IS_LOADING })
      }
      this.setState({ data: {} })
      const rawData = await this.props.pageStore.fetchRawPlaceData(this.props.pageStore.selectedPlace.id)
      const data = {
        raw: rawData.data,
        cumulativeSeries: DashboardPageStore.parseCumulativeSeriesData(rawData.data),
        dailySeries: DashboardPageStore.calcDailySeriesData(rawData.data),
        projectedCumulativeSeries: DashboardPageStore.parseCumulativeSeriesData(rawData.projected),
        projectedDailySeries: DashboardPageStore.calcDailySeriesData(rawData.projected)
      }
      this.setState({
        data,
        loadingStatus: LoadingStatus.HAS_LOADED,
        ignoreLoadingStatus: false
      })
    } catch (err) {
      console.error(err)
      this.setState({
        data: {},
        loadingStatus: LoadingStatus.HAS_ERRORED,
        ignoreLoadingStatus: false
      })
    }
  }

  render () {
    const { appStore, pageStore } = this.props
    const { t } = appStore
    const { selectedPlaces } = pageStore
    const selectedParentPlace = selectedPlaces.data.length > 0 ? selectedPlaces.data[0] : null
    const selectedChildPlace = selectedPlaces.data.length === 2 ? selectedPlaces.data[1] : null
    return (
      <div className="dashboard-place">
        <div className="dashboard-panel dashboard-spacer-y">
          <div className="dashboard-place-select flex flex-wrap items-center pb-2">
            {
              selectedParentPlace?.alpha2code
                ? <img src={`/flags/${selectedParentPlace.alpha2code.toLowerCase()}.svg`} className="h-line-xl my-1 mr-2" />
                : ''
            }
            <TypeaheadSelectInputComponent
              selectedItem={selectedParentPlace}
              options={pageStore.countries.data}
              itemToString={place => place?.name ?? ''}
              onChange={place => {
                pageStore.selectedPlaces = {
                  ...pageStore.selectedPlaces,
                  data: place ? [place] : []
                }
              }}
              className="place-select my-1 mr-2"
              inputPlaceholder={t('select-a-country')}
            />
            {(() => {
              if (!selectedParentPlace?.children?.length) return ''
              return (
                <TypeaheadSelectInputComponent
                  selectedItem={selectedChildPlace}
                  options={selectedParentPlace.children}
                  itemToString={place => place?.name ?? ''}
                  onChange={place => {
                    pageStore.selectedPlaces = {
                      ...pageStore.selectedPlaces,
                      data: place ? [selectedParentPlace, place] : [selectedParentPlace]
                    }
                  }}
                  className="place-select my-1 mr-2"
                  inputPlaceholder={t('select-a-region')}
                />
              )
            })()}
          </div>

          <div className="dashboard-place-stats">
            <DashboardStatsComponent
              rawData={this.state.data?.raw}
              className="pl-2"
            />
          </div>

          {
            (() => {
              if (!pageStore.selectedPlace) return ''

              const visualizations = (
                <div className="dashboard-place-visualizations">
                  <div className="dashboard-spacer">
                    <DashboardCumulativeGraphComponent
                      data={this.state.data?.cumulativeSeries}
                      projectedData={this.state.data.projectedCumulativeSeries}
                    />
                  </div>
                  <div className="dashboard-spacer">
                    <DashboardDailyChartComponent
                      data={this.state.data?.dailySeries}
                    />
                  </div>
                  <div className="dashboard-spacer">
                    <DashboardCompareGraphComponent
                      data={this.state.data?.cumulativeSeries}
                      places={(() => {
                        const places = (selectedChildPlace ? (selectedParentPlace?.children as Place[]) : pageStore.countries.data) ?? []
                        return places.filter(({ id }) => id !== pageStore.selectedPlace.id)
                      })()}
                      selectedPlace={pageStore.selectedPlace}
                    />
                  </div>
                </div>
              )

              if (this.state.ignoreLoadingStatus) {
                return visualizations
              }

              switch (this.state.loadingStatus) {
                case LoadingStatus.HAS_LOADED:
                  return this.state.data.raw?.length > 0
                    ? visualizations
                    : (
                      <div className="my-2 flex items-center">
                        No data for this place
                      </div>
                    )
                case LoadingStatus.HAS_ERRORED:
                  return (
                    <div>
                      <button onClick={this.fetchAndSetData}>
                        Try again
                      </button>
                    </div>
                  )
                case LoadingStatus.IS_LOADING:
                  return (
                    <div className="dashboard-spacer flex items-center justify-center h-24">
                      <LoadingComponent className="h-8 ml-2" />
                    </div>
                  )
              }
            })()
          }
        </div>
      </div>
    )
  }
}
