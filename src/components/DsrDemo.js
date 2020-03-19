import React from 'react';

// Web3 Design System by the consensys team
import { Flex, Card, Text, Button } from 'rimble-ui';
// Dai.js support for multi collateral dai
import { MDAI } from '@makerdao/dai-plugin-mcd';
// Utility function in creating proxy contracts for the relayer service
import { approveProxyInDai } from '../utils/web3';
// Bignumber JS to handle bignumber values from web3
import BigNumber from "bignumber.js"

class DsrDemo extends React.Component {
    // Define your state
    state = {
        ETH: "0.00 ETH",
        MDAI: 0,
        DSR: 0,
        DSRCalc: 0,
        APR: 0,
        deposit: 10,
        time: 1,
        total: 0
    }

    componentWillMount() {
        this.displayBalances();
        this.updateBalance();
        this.getYearlyRate();
    }

    /** 
    * Function: Displays ETH balance, mDAI balance, and, mDAI balance in the contract
    * What it does: Fetches balance values from smart contracts
    */
    displayBalances = async () => {
        let maker = this.props.maker;
        let ethBalance = await maker.getToken('ETH').balanceOf(maker.currentAddress())
        let MDAIBalance = await maker.getToken('MDAI').balanceOf(maker.currentAddress());
        let dsrManager = await maker.service('mcd:savings')
        let dsrBalance = await dsrManager.balance();
        this.setState({ ETH: ethBalance.toString(), MDAI: BigNumber(MDAIBalance._amount).toNumber(), DSR: BigNumber(dsrBalance._amount).toNumber() });
    }

    /**
     * Function: Calculate compounding interest per second 
     * Reference: https://github.com/makerdao/developerguides/blob/master/mcd/intro-rate-mechanism/intro-rate-mechanism.md
     */
    calculateInterest = async () => {
        // Rate divided per second
        let ratePerSecond = 1 + this.state.APR / 365 / 86400

        // ~30 mins compounding  
        let timeElapsed = this.state.time / 1800

        // Compounding interest formula
        let total = this.state.DSR * (Math.pow(ratePerSecond, timeElapsed))
        
        if (total !== 0) {
            this.setState({ time: this.state.time + 1})
            this.setState({ total: total })
        } else {
            this.setState({ total: 0 })
        }
    }

    /**
     * Function: Updating balance in one second interval
     */
    updateBalance = async () => {
        setInterval(async () => {
            this.displayBalances()
            this.calculateInterest()
        }, 1000)
    }

    // Function: Making proxy contract
    approveMDAI = async () => {
        await approveProxyInDai();
    }

    /**
     * Use the 'mcd:savings' service to work with the Dai Savings Rate system. 
     * Reference: https://docs.makerdao.com/dai.js/savingsservice
     */

     // Function: Join the DSR contract (Here you join 1 mDAI)
    joinDsr = async () => {
        let maker = this.props.maker;
        let dsrManager = await maker.service('mcd:savings')
        await dsrManager.join(MDAI(1));
    }
    // Function: Exit the DSR contract (Here you exit with 1 mDAI)
    exitDsr = async () => {
        let maker = this.props.maker;
        let dsrManager = await maker.service('mcd:savings')
        await dsrManager.exit(MDAI(1));
    }

    // Function: Exit all mDAI from the DSR contract 
    exitAllDsr = async () => {
        let maker = this.props.maker;
        let dsrManager = await maker.service('mcd:savings')
        await dsrManager.exitAll();
    }

    // Function: Get the rate of interest to be calculated
    getYearlyRate = async () => {
        let maker = this.props.maker;
        let dsrManager = await maker.service('mcd:savings')
        let yearlyRate = await dsrManager.getYearlyRate();
        this.setState({ APR: BigNumber(yearlyRate).toNumber() })
    }

    render() {
        return (
            <div>
                <Card width={'420px'} mx={'auto'} px={4}>
                    <Text
                        caps
                        fontSize={0}
                        fontWeight={4}
                        mb={3}
                        display={'flex'}
                        alignItems={'center'}
                    >
                        Account Info:
                     </Text>
                    <Text>{this.props.maker.currentAddress()}</Text>
                    <Text> {this.state.ETH}</Text>
                    <Flex>
                        <Text> {this.state.MDAI.toString()} MDAI</Text>
                    </Flex>
                    <Flex>
                        <Text> {this.state.total.toString()} MDAI in DSR </Text>
                    </Flex>
                    <Flex>
                        <Text> {this.state.APR.toFixed(2).toString()} % Savings Rate </Text>
                    </Flex>
                </Card>
                <p>Use the buttons below to add and retrieve Dai from DSR.</p>
                <p>Step 1: Approve Dai</p>
                <Button size='small' onClick={this.approveMDAI}>Approve Dai</Button>
                <p>Step 2: Interact with DSR</p>
                <Button size='small' onClick={this.joinDsr}>Join 1 Dai to DSR</Button><p></p>
                <Button size='small' onClick={this.exitDsr}>Retrieve 1 Dai from DSR</Button> <p></p>
                <Button size='small' onClick={this.exitAllDsr}>Retrieve all Dai from DSR</Button><p></p>
            </div>
        )
    }
}

export default DsrDemo;