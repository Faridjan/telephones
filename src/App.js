import React from 'react';
import ReactDOMServer from "react-dom/server";
import { YMaps, Map, Clusterer, Placemark, ZoomControl, TypeSelector } from "react-yandex-maps";
import { Drawer, Button, Popconfirm, Space, Input, Table, Empty, Typography, Modal } from 'antd';
import { EnvironmentOutlined, ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import 'antd/dist/antd.css';
import './App.css';

import POINTS from "./points.js";
import COULUMNS from "./columns.js";

const mapState = {
  center: [55.751574, 37.573856],
  zoom: 5
};

const { confirm } = Modal;


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ymaps: null,
      newMarkId: null,
      newMarkCoords: null,
      newMarkTitle: null,
      newMarkDescription: null,
      selectedMark: null,
      selectedMarkContent: '',
      edit: false,
      coords:[],
      dataTable: [],
      isNewMark: false
    };

    this.cancelCreate = this.cancelCreate.bind(this);
    this.showCancelConfirm = this.showCancelConfirm.bind(this)
  }

  onMapClick(event) {
    if(this.state.selectedMark) {
      this.state.selectedMark.options.set('draggable', false)
    }

    if(this.state.isNewMark) {
      this.showCancelConfirm()
    }

    this.setState(state => {
      return {selectedMark: false}
    })

    if(this.state.edit) {
      this.setState(state => {
        return {
          newMarkId: event.get("coords").join(''),
          newMarkCoords: event.get("coords"),
          edit: false,
          isNewMark: true
        };
      });
    }
  }
 
  removeMark(e) {
    const hintId = this.state.selectedMark.properties.getAll().hintId

    console.log(hintId)
    this.setState({
      coords: this.state.coords.filter(item => item.id !== this.state.selectedMark.properties.getAll().hintId ),
      edit: false,
      isNewMark: false,
      selectedMark: null,
      dataTable: []
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
      selectedMark: target
    })
    target.options.set('draggable', true)
  }

  cancelCreate = () => {
    this.setState({
      coords: this.state.coords.filter((item) => (item.id !== this.state.newMarkId)),
      isNewMark: false
    })
  }

  saveNewMark = () => {
    const {newMarkCoords, newMarkDescription, newMarkId, newMarkTitle} = this.state

    this.setState({
      coords: [
        ...this.state.coords, 
        {
          id: newMarkId,
          coords: newMarkCoords,
          title: newMarkTitle,
          description: newMarkDescription
        }
      ],
      newMarkDescription: null,
      newMarkTitle: null,
      newMarkCoords: null,
      newMarkId: null,
      dataTable: [],
      isNewMark: false,
      edit: false
    })
  }

  showCancelConfirm() {
    confirm({
      title: "Вы действительно хотити отменить изменения?",
      icon: <ExclamationCircleOutlined />,
      okText: 'Да',
      okType: 'danger',
      cancelText: 'Нет',
      onOk: this.cancelCreate
    });
  }


  onChangeTitle = ({ target: { value } }) => {
    this.setState({
      newMarkTitle: value
    })
  };

  onChangeDesc = ({ target: { value } }) => {
    this.setState({
      newMarkDescription: value
    })
  };

  handleAddRow = () => {
    const { count, dataTable } = this.state;
    const newData = {
      name: "Farid Orazovich",
      phone: '+7 705 443 51 32',
      address: `London, Park Lane no.`,
    };
    this.setState({
      dataTable: [...dataTable, newData]
    });
  };

  render() {
    const { coords, edit, selectedMark, ymaps, isNewMark, dataTable } = this.state;
    const { Title, Paragraph } = Typography;
    const { TextArea } = Input;

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
            <TypeSelector />
            <Clusterer
              modules={["clusterer.addon.balloon"]}
            >
              {coords.map((mark) => (
                <Placemark
                  key={mark.id}
                  geometry={mark.coords}
                  onClick={this.selectMark.bind(this)}
                  properties={{
                    iconContent: mark.title,
                    hintTitle: mark.title,
                    hintId: mark.id,
                    hintContent: mark.description
                  }}
                  options={{
                    preset: 'islands#blueStretchyIcon',
                  }}
                />
              ))}
            </Clusterer>
          </Map>
        </YMaps>

        {
          (isNewMark || selectedMark) 
          ? 
            <div className="createContent"> 
              {
                isNewMark
                ?
                  <>
                    <Title level={3} style={{textAlign: "center"}}>
                      Создание справочника
                    </Title>
                    <Input placeholder="Заголовок" allowClear onChange={this.onChangeTitle} />
                    <br />
                    <br />
                    <TextArea placeholder="Описание" allowClear onChange={this.onChangeDesc} />
                  </>
                :
                <>
                  <Title level={3} style={{textAlign: "center"}} editable={()=> console.log('asdfasd')}>
                    {selectedMark.properties.getAll().hintTitle}
                  </Title>
                  <Paragraph editable={()=> console.log('asdfasd')}>
                    {selectedMark.properties.getAll().hintContent}
                  </Paragraph>
                </>

              }
              <br />
              <br />
              <Table 
                columns={COULUMNS}
                dataSource={dataTable}
                locale={{ emptyText: (<Empty description="Справочник отсутствуeт" image={Empty.PRESENTED_IMAGE_SIMPLE} />) }}
                rowClassName={() => 'editable-row'}
                bordered
              />

              <div className="createFooter">
                <Space size={20}>
                  <Button onClick={this.handleAddRow} icon={<PlusOutlined />} shape="round" type="primary">
                    Добавить телефон
                  </Button>
                </Space>
                <Space size={20}>
                  {
                    selectedMark 
                    ? 
                    <>
                      <Popconfirm
                        placement="topRight"
                        title="Вы действительно хотити удалить?"
                        okText="Да"
                        onConfirm={this.removeMark.bind(this)}
                        cancelText="Нет"
                      >
                        <Button danger>Удалить</Button>
                      </Popconfirm>
                      <Button>Редактировать</Button>
                    </>
                    :
                    <>
                      <Popconfirm
                        placement="topRight"
                        title="Вы действительно хотити отменить изменения?"
                        okText="Да"
                        onConfirm={this.cancelCreate}
                        cancelText="Нет"
                      >
                        <Button>Отмена</Button>
                      </Popconfirm>
                      <Button 
                        type="primary"
                        // loading={true}
                        onClick={this.saveNewMark}
                      >
                        Сохранить
                      </Button>
                    </>
                  }
                </Space>
              </div>
            </div>
          : 
          null
        }

        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0, 
            zIndex: 3,
            padding: '30px 50px',
            background: selectedMark ? "#fff" : 'transparent',
            height: selectedMark ? "200px" : "80px",
            width: "100%",
          }}
        >
          {/* {selectedMark ?
          <>
          <Title level={4}>
            {selectedMark.properties.getAll().hintTitle}
          </Title>
          <Paragraph editable={{ onChange: this.setHintContent.bind(this) }}> {this.state.selectedMarkContent}</Paragraph>
          </> 
          : null} */}
        
          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0, 
              zIndex: 100,
              height: "70px",
              width: "100%",
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {
              
              !isNewMark 
              ?
              
              <Button 
                type="primary"
                shape="round"
                icon={<EnvironmentOutlined />}
                disabled={edit}
                onClick={() => this.setState({edit: true})} 
              >
                Создать точку
              </Button>

              : 
              null
            }

          </div>
          
        </div>

      </div>
    );
  }
}

export default App;
