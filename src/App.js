import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { YMaps, Map, Clusterer, Placemark, ZoomControl, TypeSelector } from 'react-yandex-maps'
import { Drawer, Button, Popconfirm, Space, Input, Tabs, Table, Empty, Menu, Typography, Modal, message } from 'antd'
import { EnvironmentOutlined, ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

import 'antd/dist/antd.css'
import './App.css'

import { post, get, remove } from './utils/request'
import COULUMNS from './columns.js'

const mapState = { center: [49.140572, 69.891314], zoom: 5 }

const { confirm } = Modal

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      ymaps: null,
      newMark: this.stubNewMark(),
      creating: false,
      selectedMark: null,
      marks: [],
      dataTable: [],
      isTabPhonebook: false,
      saving: false,
      edit: false,
    }

    this.inputNameRef = React.createRef()
    this.stubNewMark = this.stubNewMark.bind(this)
  }

  stubNewMark() {
    return {
      id: null,
      name: null,
      coordinates: null,
      description: null,
      contentId: null,
      options: {},
    }
  }

  componentDidMount() {
    this.fetchMarks()
  }

  async fetchMarks(page = this.state.marks) {
    try {
      const marksFromDB = await get('/marks/all?limit=0')

      // console.log(marksFromDB.data)

      this.setState({
        marks: marksFromDB.data,
      })
    } catch (e) {
      this.setState({
        loading: false,
      })
    }
  }

  onMapClick(event) {
    if (this.state.selectedMark && !this.state.edit) {
      this.setState({
        selectedMark: false,
      })
    }

    // if (this.state.creating) {
    //   this.showCancelConfirm()
    // }

    // this.setState((state) => {
    //   return { selectedMark: false }
    // })

    if (this.state.creating && !this.state.newMark.id) {
      this.setState((state) => {
        const newMark = state.newMark

        newMark.id = event.get('coords').join('')
        newMark.coordinates = event.get('coords')

        return {
          newMark,
          marks: [...state.marks, newMark],
        }
      })
    }
  }

  async removeMark(e) {
    const hintId = this.state.selectedMark.properties.getAll().hintId

    try {
      message.loading({ content: 'Удаление...', key: 'removeMark', duration: 0 })

      const removed = await remove(`/marks/remove?id=${hintId}`)

      if (removed) {
        message.success({ content: 'Удалено!', key: 'removeMark', duration: 2 })
        this.setState({
          marks: this.state.marks.filter((item) => item.id !== hintId),
          edit: false,
          selectedMark: false,
        })
      }
    } catch (e) {
      try {
        const errros = JSON.parse(e.message)

        for (const key in errros) {
          message.error(`${key} - ${errros[key]}`)
        }
      } catch (error) {
        message.error(e.message)
      }
    }

    message.destroy('removeMark')
  }

  setHintContent() {
    // if (this.state.selectedMark) {
    //   this.setState({
    //     selectedMarkContent: 'asdASD',
    //   })
    // }
  }

  selectMark(e) {
    if (!this.state.creating) {
      this.setState({
        selectedMark: e.get('target'),
      })
    }
  }

  cancelCreate() {
    this.setState({
      marks: this.state.marks.filter((item) => item.id !== this.state.newMark.id),
      creating: false,
      newMark: this.stubNewMark(),
      isTabPhonebook: false,
    })
  }

  async saveNewMark() {
    this.setState({
      saving: true,
    })

    if (!this.state.newMark.name) {
      message.error('Название метки не заполнено')
      this.inputNameRef.current.focus()
    } else {
      const { newMark } = this.state

      try {
        message.loading({ content: 'Отправка...', key: 'saveMark', duration: 0 })

        const added = await post('/marks/add', {
          name: newMark.name,
          description: newMark.description,
          coordinates: newMark.coordinates,
        })

        if (added) {
          message.success({ content: 'Сохранено!', key: 'saveMark', duration: 2 })
          this.setState((state) => {
            return {
              newMark: this.stubNewMark(),
              creating: false,
              saving: false,
            }
          })
        }
      } catch (e) {
        try {
          const errros = JSON.parse(e.message)

          for (const key in errros) {
            message.error(`${key} - ${errros[key]}`)
          }
        } catch (error) {
          message.error(e.message)
        }
      }
    }

    message.destroy('saveMark')
    this.setState({
      saving: false,
    })
  }

  showCancelConfirm() {
    confirm({
      title: 'Вы действительно хотити отменить изменения?',
      icon: <ExclamationCircleOutlined />,
      okText: 'Да',
      okType: 'danger',
      cancelText: 'Нет',
      onOk: this.cancelCreate,
    })
  }

  onChangeTitle({ target: { value } }) {
    const newMark = this.state.newMark
    newMark.name = value

    this.setState({
      newMark,
    })
  }

  onChangeDesc({ target: { value } }) {
    const newMark = this.state.newMark
    newMark.description = value

    this.setState({
      newMark,
    })
  }

  handleAddRow() {
    const { count, dataTable } = this.state
    const newData = {
      name: 'Farid Orazovich',
      phone: '+7 705 443 51 32',
      address: `London, Park Lane no.`,
    }
    this.setState({
      dataTable: [...dataTable, newData],
    })
  }

  tabOnClick(tabKey) {
    this.setState({
      isTabPhonebook: tabKey === 'phonebook',
    })
  }

  render() {
    const { marks, saving, creating, newMark, isTabPhonebook, selectedMark, dataTable, edit } = this.state
    const { Title, Paragraph } = Typography
    const { TextArea } = Input
    const { TabPane } = Tabs

    return (
      <div
        className="App"
        style={{
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <YMaps query={{ lang: 'ru_RU' }}>
          <Map
            onClick={this.onMapClick.bind(this)}
            onLoad={(ymaps) => this.setState({ ymaps })}
            defaultState={mapState}
            width="100%"
            // height="100%"
            style={{ height: 'calc(100% + 30px)' }}
          >
            <TypeSelector />
            <Clusterer modules={['clusterer.addon.balloon']}>
              {marks.map((mark) => (
                <Placemark
                  key={mark.id}
                  modules={['geoObject.addon.hint', 'geoObject.addon.balloon']}
                  geometry={mark.coordinates}
                  onClick={this.selectMark.bind(this)}
                  properties={{
                    iconContent: mark.name,
                    hintTitle: mark.name,
                    hintContent: mark.description,
                    hintId: mark.id,
                    hintContentId: mark.id,
                    // iconCaption: mark.name,
                    // balloonContent: 'Заглушка для балуна',
                  }}
                  options={{
                    preset: 'islands#blueDotIcon',
                    // cursor: 'arrow',
                    draggable: mark.id === newMark.id,
                  }}
                />
              ))}
            </Clusterer>
          </Map>
        </YMaps>

        {newMark.coordinates ? (
          <div className="createPanel" style={{ width: isTabPhonebook ? '100%' : '30%' }}>
            <div style={{ height: '100%' }}>
              <Title level={3}>Создание справочника</Title>

              <div style={{ display: isTabPhonebook ? 'none' : 'block' }}>
                <Input
                  placeholder="Название метки"
                  ref={this.inputNameRef}
                  allowClear
                  onChange={this.onChangeTitle.bind(this)}
                />
                <br />
                <br />
                <TextArea placeholder="Описание метки" allowClear onChange={this.onChangeDesc.bind(this)} />
              </div>

              <Tabs onTabClick={this.tabOnClick.bind(this)}>
                <TabPane tab="Метка" key="markOptions">
                  Настройки метки
                </TabPane>
                <TabPane tab="Справочник" key="phonebook" centered>
                  <Tabs
                    centered
                    tabBarStyle={{ background: '#fefefe', padding: '0 15px', display: 'inline-block', borderRadius: 5 }}
                  >
                    <TabPane key="menuHTML" tab="HTML">
                      <TextArea placeholder="Вставте HTML" allowClear rows={10} />
                      {/* <CKEditor editor={ClassicEditor} data="<h2>Редактируйте HTML!</h2>" height="200px" /> */}
                    </TabPane>
                    <TabPane key="menuTable" tab="Таблица">
                      <Table
                        columns={COULUMNS}
                        dataSource={dataTable}
                        locale={{
                          emptyText: (
                            <Empty description="Справочник отсутствуeт" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                          ),
                        }}
                        rowClassName={() => 'editable-row'}
                        bordered
                      />
                      <Button
                        onClick={this.handleAddRow.bind(this)}
                        icon={<PlusOutlined />}
                        shape="round"
                        type="primary"
                      />
                    </TabPane>
                    <TabPane key="menuIMG" tab="Изображение">
                      Изображение
                    </TabPane>
                    <TabPane key="menuFile" tab="Файл">
                      Файл
                    </TabPane>
                  </Tabs>
                </TabPane>
              </Tabs>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Space size={20}>
                <Popconfirm
                  placement="topRight"
                  title="Вы действительно хотити отменить изменения?"
                  okText="Да"
                  onConfirm={this.cancelCreate.bind(this)}
                  cancelText="Нет"
                >
                  <Button>Отмена</Button>
                </Popconfirm>
                <Button type="primary" disabled={saving} onClick={this.saveNewMark.bind(this)}>
                  Сохранить
                </Button>
              </Space>
            </div>
          </div>
        ) : null}

        {selectedMark ? (
          <div className="createPanel" style={{ width: isTabPhonebook ? '100%' : '30%' }}>
            <div>
              <Title level={3} style={{ textAlign: 'center' }} editable={edit}>
                {selectedMark.properties.getAll().hintTitle}
              </Title>
              <Paragraph editable={edit}>{selectedMark.properties.getAll().hintContent}</Paragraph>
              <div>
                <Tabs onTabClick={this.tabOnClick.bind(this)}>
                  <TabPane tab="Метка" key="markOptions">
                    Настройки метки
                  </TabPane>
                  <TabPane tab="Справочник" key="phonebook" centered>
                    <Tabs
                      centered
                      tabBarStyle={{
                        background: '#fefefe',
                        padding: '0 15px',
                        display: 'inline-block',
                        borderRadius: 5,
                      }}
                    >
                      <TabPane key="menuHTML" tab="HTML">
                        <TextArea placeholder="Вставте HTML" allowClear rows={10} />
                        {/* <CKEditor editor={ClassicEditor} data="<h2>Редактируйте HTML!</h2>" height="200px" /> */}
                      </TabPane>
                      <TabPane key="menuTable" tab="Таблица">
                        <Table
                          columns={COULUMNS}
                          dataSource={dataTable}
                          locale={{
                            emptyText: (
                              <Empty description="Справочник отсутствуeт" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            ),
                          }}
                          rowClassName={() => 'editable-row'}
                          bordered
                        />
                        <Button
                          onClick={this.handleAddRow.bind(this)}
                          icon={<PlusOutlined />}
                          shape="round"
                          type="primary"
                        />
                      </TabPane>
                      <TabPane key="menuIMG" tab="Изображение">
                        Изображение
                      </TabPane>
                      <TabPane key="menuFile" tab="Файл">
                        Файл
                      </TabPane>
                    </Tabs>
                  </TabPane>
                </Tabs>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Space size={20}>
                <Popconfirm
                  placement="topRight"
                  title="Вы действительно хотити удалить?"
                  okText="Да"
                  onConfirm={this.removeMark.bind(this)}
                  cancelText="Нет"
                >
                  <Button danger>Удалить</Button>
                </Popconfirm>
                <Button onClick={() => this.setState({ edit: true })}>Редактировать</Button>
              </Space>
            </div>
          </div>
        ) : null}

        <Button
          type="primary"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 15,
            transform: 'translate(-50%, 0)',
          }}
          shape="round"
          icon={<EnvironmentOutlined />}
          disabled={creating}
          onClick={() => this.setState({ creating: true })}
        >
          Создать точку
        </Button>
      </div>
    )
  }
}

export default App
