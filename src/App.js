import React from 'react';
import ReactDOMServer from "react-dom/server";
import { YMaps, Map, Clusterer, Placemark } from "react-yandex-maps";
import { Drawer, Button, Popconfirm, Space, Typography, Polygon } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import POINTS from "./points.js";

const mapState = {
  center: [55.751574, 37.573856],
  zoom: 5
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ymaps: null,
      selectedMark: null,
      selectedMarkContent: '',
      edit: false,
      coords:[]
    };
  }

  onMapClick(event) {
    if(this.state.selectedMark) {
      this.state.selectedMark.options.set('draggable', false)
    }

    this.setState(state => {
      return {selectedMark: false}
    })

    if(this.state.edit) {
      this.setState(state => {
        return {
          coords: [...state.coords, {id: event.get("coords").join(), coords: event.get("coords")}],
          edit: false
        };
      });
    }
  }
 
  clickedMark(e){
    // console.log(e.get('target').properties.getAll())
    // console.log(e.get('target').geometry.getCoordinates())
    // e.get('target').options.set('draggable', true);
    // this.state.ymaps.geoObjects.remove(e.get('target'))
  }

  removeMark(e) {
    this.setState({
      coords: this.state.coords.filter(item => item.id !== e.get('target').geometry.getCoordinates().join()) 
    })
  }

  setHintContent() {
    if(this.state.selectedMark) {
      this.setState({
        selectedMarkContent:  'asdASD' 
      })
    }
  }

  selectMark(e) {
    const target = e.get('target')

    this.setState({
      selectedMark: target,
      selectedMarkContent: target.properties.getAll.hintContent
    })
    target.options.set('draggable', true)
    
  }

  render() {
    const { coords, edit, selectedMark, ymaps } = this.state;
    const { Title, Paragraph } = Typography;

    return (
      <div className="App" style={{height:"100vh", position: 'relative'}}>
        <YMaps query={{ lang: "ru_RU" }}>
          <Map
            onClick={this.onMapClick.bind(this)}
            onLoad={ymaps => this.setState({ ymaps })}
            defaultState={mapState}
            width="100%"
            height="100%"
          >
            <Clusterer
              modules={["clusterer.addon.balloon"]}
            >
              {coords.map((coordinates) => (
                <Placemark
                  key={coordinates.id}
                  geometry={coordinates.coords}
                  onClick={this.selectMark.bind(this)}
                  // properties={{
                  //   iconContent: 'Собственный значок метки',
                  //   hintTitle: "PlaceMark 1",
                  //   hintContent: 'Content of PlaceMark.'
                  // }}
                  options={{
                    preset: 'islands#blueStretchyIcon'
                  }}
                />
              ))}
            </Clusterer>
          </Map>
        </YMaps>
    
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0, 
            zIndex: 333,
            padding: '30px 50px',
            background: selectedMark ? "#fff" : 'transparent',
            height: selectedMark ? "200px" : "80px",
            width: "100%",
          }}
        >
          {selectedMark ?
          <>
          <Title level={4}>
            {selectedMark.properties.getAll().hintTitle}
          </Title>
          <Paragraph editable={{ onChange: this.setHintContent.bind(this) }}> {this.state.selectedMarkContent}</Paragraph>
          </> 
          : null}
        
          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0, 
              zIndex: 333,
              height: "70px",
              width: "100%",
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {
              selectedMark 
              ? 
              <>
                <Button danger>Удалить</Button>
                <Button>Редактировать</Button>
              </>
              :
              <Button 
                type="primary"
                shape="round"
                icon={<EnvironmentOutlined />}
                disabled={edit}
                onClick={() => this.setState({edit: true})} 
              >
                Создать точку
              </Button>
            }

          </div>
        </div>

      </div>
    );
  }
}

export default App;
