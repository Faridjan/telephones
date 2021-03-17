import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { YMaps, Map, Clusterer, Placemark, ZoomControl, TypeSelector } from 'react-yandex-maps'
import {
  Button,
  Popconfirm,
  Space,
  Input,
  Tabs,
  Table,
  Empty,
  Spin,
  Modal,
  Menu,
  notification,
  Dropdown,
  Typography,
  List,
  message,
} from 'antd'
import {
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  MenuOutlined,
  LeftSquareOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'

import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

import 'antd/dist/antd.css'
import './App.css'

import { post, get, remove } from './utils/request'
import guide from './guide.js'
import COULUMNS from './columns.js'
import { Content } from 'antd/lib/layout/layout'

import * as XLSX from 'xlsx'

const mapState = { center: [47.0, 67.0], zoom: 5 }

const { Title, Text, Paragraph } = Typography

const { confirm } = Modal

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      ymaps: null,
      newMark: this.stubNewMark(),
      creating: false,
      creatingRed: false,
      creatingYellow: false,
      creatingGreen: false,
      selectedMark: null,
      onpenModal: false,
      onpenModalRed: false,
      onpenModalYellow: false,
      onpenModalGreen: false,
      marks: [],
      isTabPhonebook: false,
      saving: false,
      edit: false,
      content: {
        content_json: '',
        content_html: '',
      },
      loading: false,

      searchData: [],
    }

    this.inputNameRef = React.createRef()
    this.stubNewMark = this.stubNewMark.bind(this)
  }

  stubNewMark() {
    return {
      id: null,
      type: '',
      name: null,
      coordinates: null,
      description: null,
      content_id: null,
      options: {},
    }
  }

  componentDidMount() {
    this.fetchMarks()
  }

  async fetchMarks() {
    try {
      const marksFromDB = await get('/marks/all?limit=0')

      this.setState({
        marks: marksFromDB.data,
      })
    } catch (e) {
      this.setState({
        loading: false,
      })
    }
  }

  openNotificationRedMark() {
    notification.error({
      key: 'updatable',
      icon: <InfoCircleOutlined style={{ color: 'red' }} />,
      message: 'В обработке!',
      description: (
        <>
          <Text>Данный населенный пункт был отмечен как занятый.</Text>
          <br />
          <br />
          <Popconfirm
            placement="topRight"
            title="Вы действительно хотити удалить?"
            okText="Да"
            onConfirm={this.removeMark.bind(this)}
            cancelText="Нет"
          >
            <Button danger>Удалить</Button>
          </Popconfirm>
        </>
      ),
    })
  }

  openNotificationYellowMark() {
    notification.warning({
      key: 'updatable',
      icon: <InfoCircleOutlined style={{ color: '#d3c759' }} />,
      message: 'Нужна помощь.',
      description: (
        <>
          <Text>Данный населенный пункт был отмечен как тот в котором нужна помощь в поиске телефоных номеров.</Text>
          <br />
          <br />
          <Popconfirm
            placement="topRight"
            title="Вы действительно хотити удалить?"
            okText="Да"
            onConfirm={this.removeMark.bind(this)}
            cancelText="Нет"
          >
            <Button danger>Удалить</Button>
          </Popconfirm>
        </>
      ),
    })
  }

  openNotificationGreenMark() {
    notification.success({
      key: 'updatable',
      icon: <InfoCircleOutlined style={{ color: 'green' }} />,
      message: 'Пересекаются усилия!',
      description: (
        <>
          <Text>Данный населенный пункт был отмечен как тот в котором пересекаются усилия.</Text>
          <br />
          <br />
          <Popconfirm
            placement="topRight"
            title="Вы действительно хотити удалить?"
            okText="Да"
            onConfirm={this.removeMark.bind(this)}
            cancelText="Нет"
          >
            <Button danger>Удалить</Button>
          </Popconfirm>
        </>
      ),
    })
  }

  onMapClick(event) {
    this.setState({
      searchData: [],
    })

    if (this.state.selectedMark && !this.state.edit) {
      this.setState({
        selectedMark: false,
        content: {
          content_json: '',
          content_html: '',
        },
      })
    }

    // Простое создание
    if (this.state.creating && !this.state.newMark.id) {
      this.setState((state) => {
        const newMark = state.newMark

        newMark.id = event.get('coords').join('')
        newMark.type = 'base'
        newMark.options.preset = 'islands#blueCircleDotIcon'
        newMark.coordinates = event.get('coords')

        return {
          newMark,
          marks: [...state.marks, newMark],
        }
      })
    }

    // Если в обработке
    if (this.state.creatingRed && !this.state.newMark.id) {
      this.setState((state) => {
        const newMark = state.newMark

        newMark.id = event.get('coords').join('')
        newMark.coordinates = event.get('coords')
        newMark.type = 'red'
        newMark.options.preset = 'islands#redCircleDotIcon'
        newMark.name = event.get('coords').join('')
        newMark.description = 'Отмеченно как занятый...'

        return {
          newMark,
          marks: [...state.marks, newMark],
        }
      })
      this.saveNewMark()
    }

    // Пересекаются усилия
    if (this.state.creatingYellow && !this.state.newMark.id) {
      this.setState((state) => {
        const newMark = state.newMark

        newMark.id = event.get('coords').join('')
        newMark.coordinates = event.get('coords')
        newMark.type = 'yellow'
        newMark.options.preset = 'islands#yellowCircleDotIcon'
        newMark.name = event.get('coords').join('')
        newMark.description = 'Пересекаются усилия...'

        return {
          newMark,
          marks: [...state.marks, newMark],
        }
      })
      this.saveNewMark()
    }

    // "Попросить помощь"
    if (this.state.creatingGreen && !this.state.newMark.id) {
      this.setState((state) => {
        const newMark = state.newMark

        newMark.id = event.get('coords').join('')
        newMark.coordinates = event.get('coords')
        newMark.type = 'green'
        newMark.options.preset = 'islands#greenCircleDotIcon'
        newMark.name = event.get('coords').join('')
        newMark.description = 'Попросить помощь...'

        return {
          newMark,
          marks: [...state.marks, newMark],
        }
      })
      this.saveNewMark()
    }
  }

  createContentHtml({ target: { value } }) {
    const content = this.state.content
    content.content_html = value

    this.setState({
      content,
    })
  }

  async removeMark(e) {
    const id = this.state.selectedMark.id

    try {
      message.loading({ content: 'Удаление...', key: 'removeMark', duration: 0 })

      const removed = await remove(`/marks/remove?id=${id}`)

      if (removed) {
        message.success({ content: 'Удалено!', key: 'removeMark', duration: 2 })
        this.setState({
          marks: this.state.marks.filter((item) => item.id !== id),
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
      const target = e.get('target')
      const options = target.properties.getAll().hintOptions

      this.setState({
        selectedMark: {
          id: target.properties.getAll().hintId,
          name: target.properties.getAll().hintTitle,
          options: target.properties.getAll().hintOptions,
          content_id: target.properties.getAll().hintContentId,
          description: target.properties.getAll().hintDescription,
        },
      })

      if (options && options.preset === 'islands#redCircleDotIcon') {
        this.openNotificationRedMark()
      } else if (options && options.preset === 'islands#yellowCircleDotIcon') {
        this.openNotificationYellowMark()
      } else if (options && options.preset === 'islands#greenCircleDotIcon') {
        this.openNotificationGreenMark()
      }
    }
  }

  cancelCreate() {
    this.setState({
      marks: this.state.marks.filter((item) => item.id !== this.state.newMark.id),
      creating: false,
      newMark: this.stubNewMark(),
      isTabPhonebook: false,
      content: {
        content_json: '',
        content_html: '',
      },
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
      const { newMark, content } = this.state

      try {
        message.loading({ content: 'Отправка...', key: 'saveMark', duration: 0 })

        const added = await post('/marks/add', {
          name: newMark.name,
          description: newMark.description,
          coordinates: newMark.coordinates,
          options: newMark.options,
          content_html: content.content_html,
          content_json: JSON.stringify(content.content_json),
        })

        if (added) {
          this.setState((state) => {
            return {
              marks: this.state.marks.filter((item) => {
                if (item.id === this.state.newMark.id) {
                  item.id = added.mark_id
                  item.content_id = added.content_id
                }
                return true
              }),
              newMark: this.stubNewMark(),
              creating: false,
              creatingRed: false,
              creatingYellow: false,
              creatingGreen: false,
              saving: false,
              content: {
                content_html: '',
                content_json: '',
              },
            }
          })
          message.success({ content: 'Сохранено!', key: 'saveMark', duration: 2 })
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

  onChangeDesc(data) {
    const newMark = this.state.newMark
    newMark.description = data

    this.setState({
      newMark,
    })
  }

  onDragMark(e) {
    const newMark = this.state.newMark
    newMark.coordinates = e.get('target').geometry.getCoordinates()

    this.setState({
      newMark,
    })
  }

  async fetchContent() {
    try {
      this.setState({
        loading: true,
      })

      const contentFromDb = await get('/contents?id=' + this.state.selectedMark.content_id)

      if (contentFromDb) {
        this.setState({
          content: contentFromDb,
        })
      }
    } catch (e) {
      console.log(e)
    } finally {
      this.setState({
        loading: false,
      })
    }
  }

  onSearch({ target: { value } }) {
    if (value.trim() && value.length >= 1) {
      const results = this.state.marks.filter((mark) => mark.name.toLowerCase().includes(value))

      this.setState({
        searchData: results,
      })
    } else {
      this.setState({
        searchData: [],
      })
    }
  }

  tabOnClick(tabKey) {
    this.setState({
      isTabPhonebook: tabKey === 'phonebook',
    })
    if (tabKey === 'phonebook') {
      if (this.state.selectedMark) {
        this.fetchContent()
      }
    }
  }

  readExcel(file) {
    const promise = new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      fileReader.readAsArrayBuffer(file)

      fileReader.onload = (e) => {
        const bufferArray = e.target.result

        const wb = XLSX.read(bufferArray, { type: 'buffer' })

        const wsname = wb.SheetNames[0]

        const ws = wb.Sheets[wsname]

        const data = XLSX.utils.sheet_to_json(ws)

        resolve(data)
      }

      fileReader.onerror = (error) => {
        reject(error)
      }
    })

    promise.then((d) => {
      const { content } = this.state

      content.content_json = d

      this.setState({
        content,
      })
    })
  }

  exportJS() {
    const data = this.state.content.content_json
    const fields = Object.keys(data[0])

    const wb = XLSX.utils.book_new() // book
    const ws = XLSX.utils.json_to_sheet(data, { header: fields }) // sheet

    XLSX.utils.book_append_sheet(wb, ws, 'Fred')
    XLSX.writeFile(wb, 'Demo.xlsx')
  }

  render() {
    const { marks, saving, creating, newMark, isTabPhonebook, content, selectedMark, edit, searchData } = this.state

    const { TextArea, Search } = Input
    const { TabPane } = Tabs

    function createMarkup() {
      return { __html: selectedMark.description }
    }

    const menu = (
      <Menu>
        <Menu.Item key="0" onClick={() => this.setState({ onpenModalGreen: true })}>
          ПОПРОСИТЬ ПОМОЩЬ
        </Menu.Item>
        <Menu.Item key="1" onClick={() => this.setState({ onpenModalYellow: true })}>
          ПЕРЕСЕКАЮТСЯ УСИЛИЯ
        </Menu.Item>
        <Menu.Item key="2" onClick={() => this.setState({ onpenModalRed: true })}>
          ОТМЕТИТЬ КАК ЗАНЯТЫЙ
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={() => this.setState({ onpenModal: true })} key="3">
          РУКОВОДСТВО
        </Menu.Item>
      </Menu>
    )

    return (
      <div
        className="App"
        style={{
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Modal
          title="ПРИМЕРЫ НАХОЖДЕНИЯ ТЕЛЕФОННЫХ НОМЕРОВ, ПРИ ОТСУТСТВИИ ТЕЛЕФОННЫХ СПРАВОЧНИКОВ"
          width="90%"
          height="100vh"
          style={{
            marginBottom: 60,
          }}
          visible={this.state.onpenModal}
          onOk={() => this.setState({ onpenModal: false })}
          onCancel={() => this.setState({ onpenModal: false })}
        >
          <div dangerouslySetInnerHTML={{ __html: guide }} />
        </Modal>

        <Modal
          title="Отметить как занятый"
          visible={this.state.onpenModalRed}
          onOk={() => this.setState({ creatingRed: true, onpenModalRed: false })}
          okText="Выбрать позицию"
          onCancel={() => this.setState({ onpenModalRed: false })}
          cancelText="Отмена"
        >
          <Text>
            В выбранной позиции будет создана новая точка красного цвета. Это означает, что населенный пункт будет
            отмечен как занятый. Не забудьте своевремeнно удалить.
          </Text>
        </Modal>

        <Modal
          title="Пересекаются усилия?"
          visible={this.state.onpenModalYellow}
          onOk={() => this.setState({ creatingYellow: true, onpenModalYellow: false })}
          okText="Выбрать позицию"
          onCancel={() => this.setState({ onpenModalYellow: false })}
          cancelText="Отмена"
        >
          <Text>
            В выбранной позиции будет создана новая точка желтого цвета. Это означает, что в данном населенном пункте
            пересекаются усилия. Не забудьте своевремeнно удалить.
          </Text>
        </Modal>

        <Modal
          title="Попросить помощь"
          visible={this.state.onpenModalGreen}
          onOk={() => this.setState({ creatingGreen: true, onpenModalGreen: false })}
          okText="Выбрать позицию"
          onCancel={() => this.setState({ onpenModalGreen: false })}
          cancelText="Отмена"
        >
          <Text>
            В выбранной позиции будет создана новая точка зеленного цвета. Это означает, что в данном населенном пункте
            <i> нужна помощь в поиске телефонных номеров</i>.
          </Text>
        </Modal>

        <YMaps query={{ lang: 'ru_RU' }}>
          <Map
            onClick={this.onMapClick.bind(this)}
            onLoad={(ymaps) => this.setState({ ymaps })}
            defaultState={mapState}
            width="100%"
            style={{ height: 'calc(100% + 30px)' }}
          >
            <TypeSelector />
            <Clusterer modules={['clusterer.addon.balloon']}>
              {marks.map((mark) => (
                <Placemark
                  key={mark.id}
                  modules={['geoObject.addon.hint', 'geoObject.addon.balloon']}
                  geometry={mark.coordinates}
                  onDragEnd={this.onDragMark.bind(this)}
                  onClick={this.selectMark.bind(this)}
                  properties={{
                    iconContent: mark.name,
                    hintTitle: mark.name,
                    hintOptions: mark.options,
                    hintContent: mark.name,
                    hintDescription: mark.description,
                    hintId: mark.id,
                    hintContentId: mark.content_id,
                    // iconCaption: mark.name,
                    // balloonContent: 'Заглушка для балуна',
                  }}
                  options={{
                    preset: mark.options ? mark.options.preset : 'islands#blueCircleDotIcon',
                    // cursor: 'arrow',
                    draggable: mark.id === newMark.id,
                  }}
                />
              ))}
            </Clusterer>
          </Map>
        </YMaps>
        <div
          style={{
            position: 'absolute',
            left: 30,
            top: 10,
            zIndex: 44,
            width: 100,
          }}
        >
          <Dropdown overlay={menu} trigger={['click']}>
            <MenuOutlined
              style={{
                fontSize: 25,
                fontWeight: 800,
                color: '#fff',
                background: '#1890ff',
                padding: 5,
                borderRadius: 3,
              }}
              onClick={(e) => e.preventDefault()}
            />
          </Dropdown>
        </div>
        <div
          style={{
            position: 'absolute',
            right: '120px',
            color: 'green',
            top: 10,
            zIndex: 4,
            width: 350,
          }}
        >
          <Search
            placeholder="Поиск справочников"
            onSearch={this.onSearch.bind(this)}
            allowClear={true}
            onChange={this.onSearch.bind(this)}
            enterButton
          />
          {searchData.length >= 1 ? (
            <List
              style={{ background: '#fff' }}
              bordered
              header={<div style={{ fontSize: 16, fontWeight: 600 }}>Результаты поиска</div>}
              dataSource={searchData}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    this.setState({ selectedMark: item, searchData: [] })
                  }}
                >
                  <Text>{item.name}</Text>
                </List.Item>
              )}
            />
          ) : null}
        </div>
        {newMark.coordinates && newMark.type === 'base' ? (
          <div className="createPanel" style={{ width: isTabPhonebook ? '100%' : '30%' }}>
            <div>
              {isTabPhonebook ? (
                <LeftSquareOutlined
                  onClick={() => this.setState({ isTabPhonebook: false })}
                  style={{
                    position: 'absolute',
                    fontSize: 30,
                    color: 'rgb(24, 144, 255)',
                    right: 20,
                    top: 20,
                    cursor: 'pointer',
                  }}
                />
              ) : null}

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
                <CKEditor
                  editor={ClassicEditor}
                  config={{ toolbar: [] }}
                  onChange={(event, editor) => {
                    const data = editor.getData()
                    this.onChangeDesc(data)
                  }}
                  height="200px"
                />
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
                    <TabPane key="menuTable" tab="Таблица">
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          this.readExcel(file)
                        }}
                      />
                      <br />
                      <br />
                      <Table
                        style={{
                          marginBottom: 80,
                        }}
                        columns={COULUMNS}
                        rowKey="__rowNum__"
                        dataSource={content.content_json}
                        locale={{
                          emptyText: (
                            <Empty description="Справочник отсутствуeт" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                          ),
                        }}
                        rowClassName={() => 'editable-row'}
                        pagination={false}
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
                // position: 'fixed',
                // right: 0,
                // bottom: 0,
                // height: 40,
                // padding: 40,
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
        {/* Редактирование Точки */}
        {selectedMark && selectedMark.options.preset === 'islands#blueCircleDotIcon' ? (
          <div className="createPanel" style={{ width: isTabPhonebook ? '100%' : '30%' }}>
            {isTabPhonebook ? (
              <LeftSquareOutlined
                onClick={() => this.setState({ isTabPhonebook: false })}
                style={{
                  position: 'absolute',
                  fontSize: 30,
                  color: 'rgb(24, 144, 255)',
                  right: 20,
                  top: 20,
                  cursor: 'pointer',
                }}
              />
            ) : null}

            <div>
              <Title level={3} style={{ textAlign: 'center' }} editable={edit}>
                {selectedMark.name}
              </Title>
              <div dangerouslySetInnerHTML={createMarkup()} />
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
                      <TabPane key="menuTable" tab="Таблица">
                        {this.state.content.content_json ? (
                          <>
                            <Button onClick={this.exportJS.bind(this)}>Скачать в EXCEL</Button>
                            <br />
                            <br />
                          </>
                        ) : null}
                        <div
                          style={{
                            display: this.state.loading ? 'flex' : 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Spin />
                        </div>
                        <Table
                          columns={COULUMNS}
                          dataSource={content.content_json}
                          locale={{
                            emptyText: (
                              <Empty description="Справочник отсутствуeт" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            ),
                          }}
                          rowClassName={() => 'editable-row'}
                          pagination={false}
                          bordered
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
              {!edit ? (
                <Button onClick={() => this.setState({ edit: true })}>Редактировать</Button>
              ) : (
                <Space size={20}>
                  <Button type="dashed" onClick={() => this.setState({ edit: false })}>
                    Отмена
                  </Button>
                  <div>
                    <Button type="primary" onClick={() => this.setState({ edit: false })}>
                      Сохранить
                    </Button>
                    <Popconfirm
                      placement="topRight"
                      title="Вы действительно хотити удалить?"
                      okText="Да"
                      onConfirm={this.removeMark.bind(this)}
                      cancelText="Нет"
                    >
                      <Button danger>Удалить</Button>
                    </Popconfirm>
                  </div>
                </Space>
              )}
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
