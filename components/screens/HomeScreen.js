import React, {Component} from 'react';
import {FlatList, StyleSheet, ActivityIndicator, View} from 'react-native';
import {Button, Icon, Input, ListItem, Overlay, SearchBar, Text} from "react-native-elements";
import * as Animatable from 'react-native-animatable';
import Sails from "../../singletons/SailsIO";
import ActionButton from 'react-native-action-button';

import AnimatedSvg from "../AnimatedSvg";

const styles = StyleSheet.create({
    modal: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default class HomeScreen extends Component {

    constructor(props) {
        super(props);
        this.state = {
            rooms: [],
            search: '',
            filteredRooms: [],
            loading: true,
            refreshing: false,
            overlayIsVisible: false,
            creationRoomLoading: false,
            newRoomName: ''
        };
        this._fetchRooms();
    }

    static navigationOptions = {
        title: 'Salles disponibles',
    };

    renderHeader = () => {
        return <SearchBar
            placeholder="Recherche d'une salle..."
            value={this.state.search}
            onChangeText={this._searchRooms}
            lightTheme/>;
    };

    renderFooter = () => {
        if (!this.state.loading) return null;

        return (
            <View
                style={{
                    paddingVertical: 20,
                    borderTopWidth: 1,
                    align: 'center',
                    borderColor: "#CED0CE"
                }}
            >
                <Animatable.Text animation="slideInDown" duration={200} direction="alternate">Chargement des
                    salles...</Animatable.Text>
                <ActivityIndicator animating size="large"/>
            </View>
        );
    };

    renderSeparator = () => {
        return (
            <View
                style={{
                    height: 1,
                    width: "100%",
                    backgroundColor: "#CED0CE",
                }}
            />
        );
    };

    render() {

        return (
            <View>
                <FlatList
                    data={this.state.filteredRooms}
                    keyExtractor={item => item.id.toString()}
                    ItemSeparatorComponent={this.renderSeparator}
                    ListHeaderComponent={this.renderHeader}
                    ListFooterComponent={this.renderFooter}
                    refreshing={this.state.refreshing}
                    onRefresh={this._handleRefresh}
                    renderItem={({item}) => (
                        <ListItem
                            roundAvatar
                            button
                            onPress={() => this._navigateToRoom(item)}
                            title={item.name + ' (#' + item.id + ')'}
                            subtitle={item.players.length.toString() + '/6 joueurs  -  ' + 'Tour ' + item.turnCount.toString()}
                            leftIcon={{name: item.status === 'ACTIVE' ? 'lock-open' : 'lock'}}
                            chevron={true}
                        />
                    )}
                />
                <ActionButton
                    buttonColor="#FDC007"
                    onPress={() => {this._openRoomCreationModal()}}
                />
                <Overlay
                    height={300}
                    overlayStyle={styles.modal}
                    isVisible={this.state.overlayIsVisible}
                    onBackdropPress={() => this.setState({ overlayIsVisible: false })}>
                    <Input
                        containerStyle={{paddingBottom: 15}}
                        placeholder='Nom de la salle'
                        onChangeText={(newRoomName) => this.setState({newRoomName})}
                    />
                    <Button
                        containerStyle={{width: 100}}
                        title="Créer la salle"
                        loading={this.state.creationRoomLoading}
                        onPress={() => {this._createNewRoom()}}
                    />
                </Overlay>
            </View>

        );
    };

    _handleRefresh = () => {
        this.setState({
            refreshing: true
        }, () => {
            this._fetchRooms();
        })
    };

    _openRoomCreationModal = () => {
        this.setState({overlayIsVisible: true})
    };


    _searchRooms = (search) => {
        let results = this.state.rooms.filter(r => r.name.toUpperCase().includes(search.toUpperCase()));
        this.setState({
            filteredRooms: results,
            search
        });

    };


    _navigateToRoom = (room) => {
        console.log('Navigating to room ID #' + room.id);
        this.props.navigation.navigate('Room', {roomId: room.id});
    };

    /*_signOutAsync = async () => {
        await AsyncStorage.clear();
        this.props.navigation.navigate('Auth');
    };*/

    _fetchRooms = async () => {
        await Sails.io.get('/room', (r) => {
            this.setState({
                rooms: r,
                filteredRooms: r.filter(r => r.name.toUpperCase().includes(this.state.search.toUpperCase())),
                loading: false,
                refreshing: false
            });
        });
    };

    _createNewRoom = () => {
        this.setState({creationRoomLoading: true});
        if (this.state.newRoomName.length) {
            Sails.io.post('/room', {
                name: this.state.newRoomName
            }, (r) => {
                this.setState({
                    overlayIsVisible: false,
                    creationRoomLoading: false,
                    newRoomName: ''
                });
                this.props.navigation.navigate('Room', {roomId: r.id});
            })
        }
    }
}