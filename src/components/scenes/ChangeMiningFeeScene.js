// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js/types'
import * as React from 'react'
import { ScrollView, StyleSheet, Switch, Text, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import EntypoIcon from 'react-native-vector-icons/Entypo'
import { connect } from 'react-redux'

import { sendConfirmationUpdateTx } from '../../actions/SendConfirmationActions.js'
import { FEE_STRINGS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { getGuiMakeSpendInfo } from '../../modules/UI/scenes/SendConfirmation/selectors.js'
import { getSelectedCurrencyCode } from '../../modules/UI/selectors.js'
import type { CurrencySetting, FeeOption } from '../../reducers/scenes/SettingsReducer'
import { dayText, nightText } from '../../styles/common/textStyles.js'
import { THEME } from '../../theme/variables/airbitz.js'
import type { Dispatch, RootState } from '../../types/reduxTypes.js'
import { FormField } from '../common/FormField.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type OwnProps = {
  wallet: EdgeCurrencyWallet
}

type StateProps = {
  networkFeeOption?: FeeOption,
  customNetworkFee?: Object,
  currencySettings: CurrencySetting
}

type DispatchProps = {
  onSubmit(networkFeeOption: FeeOption, customNetworkFee: Object, setDefault: boolean, currencyCode: string): mixed
}

type Props = OwnProps & StateProps & DispatchProps

type State = {
  networkFeeOption: FeeOption,
  customNetworkFee: Object,
  currencyCode: string,
  setDefault: boolean
}

export class ChangeMiningFee extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    let { networkFeeOption = 'standard', customNetworkFee = {} } = props // Initially standard

    const setDefault = !(props.currencySettings?.defaultFee == null) // Set false if null, true if exists

    if (!(props.currencySettings?.defaultFee == null)) {
      networkFeeOption = props.currencySettings.defaultFee // Set default fee
    }

    const currencyCode = props.wallet.currencyInfo.currencyCode
    const customFormat = this.getCustomFormat()

    if (customFormat != null && Object.keys(customNetworkFee).length !== customFormat.length) {
      // Reset the custom fees if they don't match the format:
      const defaultCustomFee = {}
      for (const key of customFormat) defaultCustomFee[key] = ''
      this.state = { networkFeeOption, customNetworkFee: defaultCustomFee, currencyCode, setDefault }
    } else {
      // Otherwise, use the custom fees from before:
      this.state = { networkFeeOption, customNetworkFee, currencyCode, setDefault }
    }
  }

  getCustomFormat(): string[] | void {
    const { wallet } = this.props
    if (wallet.currencyInfo.defaultSettings != null) {
      const { customFeeSettings } = wallet.currencyInfo.defaultSettings
      return customFeeSettings
    }
  }

  onSubmit = () => {
    const { networkFeeOption, customNetworkFee, setDefault, currencyCode } = this.state
    this.props.onSubmit(networkFeeOption, customNetworkFee, setDefault, currencyCode)
    Actions.pop()
  }

  render() {
    const customFormat = this.getCustomFormat()

    return (
      // Add checkbox
      <SceneWrapper background="body" hasTabs={false} avoidKeyboard>
        {/* <View>
          <Text>Set Default Fee for {this.state.currencyCode}</Text>
        </View> */}
        <ScrollView style={styles.content}>
          {this.renderRadioRow('high', s.strings.mining_fee_high_label_choice)}
          {this.renderRadioRow('standard', s.strings.mining_fee_standard_label_choice)}
          {this.renderRadioRow('low', s.strings.mining_fee_low_label_choice)}
          {customFormat != null ? this.renderRadioRow('custom', s.strings.mining_fee_custom_label_choice) : null}
          {customFormat != null ? this.renderCustomFee(customFormat) : null}
          {this.renderFeeWarning()}

          <View>
            <TouchableWithoutFeedback>
              <View style={styles.paddingLeftIcon}>
                <Switch value={this.state.setDefault} onChange={() => this.toggleDefaultFee()} />
              </View>
            </TouchableWithoutFeedback>
            <View style={styles.paddingRightIcon}>
              <Text>
                Default Fee for {this.state.currencyCode} is {this.state.setDefault ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>

          <PrimaryButton onPress={this.onSubmit} style={styles.saveButton}>
            <PrimaryButton.Text>{s.strings.save}</PrimaryButton.Text>
          </PrimaryButton>
        </ScrollView>
      </SceneWrapper>
    )
  }

  renderRadioRow(value: FeeOption, label: string) {
    const { networkFeeOption } = this.state

    return (
      <TouchableWithoutFeedback onPress={() => this.setState({ networkFeeOption: value })}>
        <View style={styles.radioRow}>
          <View style={[styles.radio, networkFeeOption === value ? styles.selected : null]} />
          <Text style={dayText('row-left')}>{label}</Text>
        </View>
      </TouchableWithoutFeedback>
    )
  }

  toggleDefaultFee = () => {
    this.setState(prevState => ({
      setDefault: !prevState.setDefault
    }))
  }

  renderCustomFee(customFormat: string[]): React.Node {
    const { networkFeeOption, customNetworkFee } = this.state
    if (networkFeeOption !== 'custom') return null

    return (
      <View style={styles.customArea}>
        {customFormat.map(key => (
          <FormField
            key={key}
            keyboardType="numeric"
            onChangeText={text =>
              this.setState({
                customNetworkFee: { ...customNetworkFee, [key]: text }
              })
            }
            value={customNetworkFee[key]}
            label={FEE_STRINGS[key] || key}
          />
        ))}
      </View>
    )
  }

  renderFeeWarning() {
    const { networkFeeOption } = this.state
    if (networkFeeOption !== 'custom' && networkFeeOption !== 'low') return null

    return (
      <View style={styles.warningBox}>
        <EntypoIcon name="warning" color={THEME.COLORS.WHITE} size={THEME.rem(1.4)} />
        <Text style={nightText('small')}>{s.strings.warning_low_or_custom_fee}</Text>
      </View>
    )
  }
}

const rawStyles = {
  content: {
    flexGrow: 1,
    backgroundColor: THEME.COLORS.WHITE,
    padding: THEME.rem(1.4)
  },

  // Radio input:
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.rem(1)
  },
  radio: {
    borderRadius: THEME.rem(0.5),
    marginRight: THEME.rem(0.5),
    width: THEME.rem(1),
    height: THEME.rem(1),
    borderWidth: THEME.rem(1 / 16),
    borderColor: THEME.COLORS.GRAY_2
  },
  selected: {
    borderColor: THEME.COLORS.ACCENT_BLUE,
    backgroundColor: THEME.COLORS.ACCENT_BLUE
  },

  // Custom fee area:
  customArea: {
    marginBottom: THEME.rem(1)
  },

  // Warning box:
  warningBox: {
    padding: THEME.rem(0.5),

    backgroundColor: THEME.COLORS.ACCENT_ORANGE,
    borderRadius: THEME.rem(0.5),

    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  paddingRightIcon: {
    paddingLeft: THEME.rem(0.75)
  },
  paddingLeftIcon: {
    paddingRight: THEME.rem(0.75)
  },

  saveButton: {
    marginTop: THEME.rem(1.25)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
export const ChangeMiningFeeScene = connect(
  (state: RootState): StateProps => ({
    // Connector
    // Selector
    networkFeeOption: getGuiMakeSpendInfo(state).networkFeeOption,
    customNetworkFee: getGuiMakeSpendInfo(state).customNetworkFee,
    currencySettings: state.ui.settings[getSelectedCurrencyCode(state)]
  }),
  (dispatch: Dispatch): DispatchProps => ({
    // dispatch = setter
    onSubmit(networkFeeOption: FeeOption, customNetworkFee: Object, setDefault: boolean, currencyCode: string) {
      if (setDefault) {
        console.log(`Has default fee: ${setDefault.toString()}`)
        dispatch({
          type: 'UI/SETTINGS/SET_DEFAULT_FEE',
          data: { currencyCode: currencyCode, defaultFee: networkFeeOption, customFee: customNetworkFee }
        })
      }
      dispatch(sendConfirmationUpdateTx({ networkFeeOption, customNetworkFee }))
    }
  })
)(ChangeMiningFee)

// add pulling in default fee at send confirmation screen.
