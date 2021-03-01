import React from 'react';
import { YMaps, Map, Clusterer, Placemark } from "react-yandex-maps";
import { Drawer, Button, Popconfirm, Space, Polygon } from 'antd';
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
      selectedPoint: null,
      visibleSettings: false
    };
  }

fred = () => {
  this.myRef1.editor
}

  closeSettings = point => {
    this.setState({
      visibleSettings: false,
    });
  };

  onPlacemarkClick = point => () => {
    this.setState({ selectedPoint: point, visibleSettings: !this.state.visibleSettings });
  };

  render() {
    const { selectedPoint, openedDescription, visibleSettings } = this.state;

    return (
      <div className="App">
        <YMaps query={{ lang: "ru_RU", load: "package.full" }}>
          <Map
          instanceRef={(map) => {
            if (map) {
              this.myMap = map
            }
          }}
          onLoad={ref => (this.myMap = ref)}
            defaultState={mapState}
            modules={["control.ZoomControl", "Polygon", "geoObject.addon.editor"]}
            width="100%"
            height="100vh"
          >
            <Clusterer
              options={{
                preset: "islands#invertedVioletClusterIcons",
                groupByCoordinates: false,
              }}
            >
              {POINTS.map((point, index) => (
                <Placemark
                  modules={["geoObject.addon.hint"]}
                  instanceRef={(map) => {
                    if (map) {
                      this["myRef" + index] = map
                    }
                  }}
                  key={index}
                  geometry={point.coords}
                  onClick={this.onPlacemarkClick(point)}
                  properties={{
                    item: index,
                    iconContent:point.title
                  }}
                  options={{
                    preset:"islands#blueStretchyIcon",
                    draggiable: true
                  }}
                />
              ))}
            </Clusterer>
          </Map>
        </YMaps>
        <Drawer
          title={selectedPoint ? selectedPoint.title : null}
          placement="right"
          closable={true}
          width="30%"
          height="100%"
          onClose={this.closeSettings}
          visible={visibleSettings}
          footer={
            <div
              style={{
                textAlign: 'center',
              }}
            >
              <Space size="large">
                <Button type="primary" onClick={this.fred}>
                  Переместить
                </Button>
                <Popconfirm title="Вы точно хотить удалить?" okText="Да" cancelText="Нет">
                  <Button danger>Удалить</Button>
                </Popconfirm>
              </Space>
            </div>
          }
        >

        </Drawer>
      </div>
    );
  }
}

export default App;
