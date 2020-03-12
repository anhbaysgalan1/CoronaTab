import { Entity, PrimaryColumn, Column } from 'typeorm'
import { Model } from '../../model'
import { PlaceTypeId } from '../../seeds/places/types'
import { LocaleTranslations } from '../../seeds/locales'

@Entity()
export class PlaceType extends Model<PlaceType> {
  @PrimaryColumn()
  id: PlaceTypeId

  @Column('json')
  locales: LocaleTranslations

  name?: string
}
