import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { YMaps, Map, Clusterer, Placemark, ZoomControl, TypeSelector } from 'react-yandex-maps'
import {
  Drawer,
  Button,
  Popconfirm,
  Space,
  Input,
  Tabs,
  Table,
  Empty,
  Spin,
  Menu,
  Typography,
  Divider,
  List,
  Modal,
  message,
} from 'antd'
import { EnvironmentOutlined, ExclamationCircleOutlined, PlusOutlined, LeftSquareOutlined } from '@ant-design/icons'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'

import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

import 'antd/dist/antd.css'
import './App.css'

import { post, get, remove } from './utils/request'
import COULUMNS from './columns.js'
import { Content } from 'antd/lib/layout/layout'

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
      content: {
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
    this.setState({
      searchData: [],
    })

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

      this.setState({
        selectedMark: {
          id: target.properties.getAll().hintId,
          name: target.properties.getAll().hintTitle,
          content_id: target.properties.getAll().hintContentId,
          description: target.properties.getAll().hintDescription,
        },
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
      const { newMark, content } = this.state

      try {
        message.loading({ content: 'Отправка...', key: 'saveMark', duration: 0 })

        const added = await post('/marks/add', {
          name: newMark.name,
          description: newMark.description,
          coordinates: newMark.coordinates,
          content_html: content.content_html,
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
              saving: false,
              content: {
                content_html: '',
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

  onChangeDesc({ target: { value } }) {
    const newMark = this.state.newMark
    newMark.description = value

    this.setState({
      newMark,
    })
  }

  onDragMark(e) {
    console.log('test')
    const newMark = this.state.newMark
    newMark.coordinates = e.get('target').geometry.getCoordinates()

    console.log(newMark)

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
    if (tabKey === 'phonebook') {
      if (this.state.selectedMark) {
        this.fetchContent()
      }
    }
  }

  render() {
    const { marks, saving, creating, newMark, isTabPhonebook, selectedMark, dataTable, edit, searchData } = this.state
    const { Title, Text, Paragraph } = Typography
    const { TextArea, Search } = Input
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
                  onDragEnd={this.onDragMark.bind(this)}
                  onClick={this.selectMark.bind(this)}
                  properties={{
                    iconContent: mark.name,
                    hintTitle: mark.name,
                    hintContent: mark.name,
                    hintDescription: mark.description,
                    hintId: mark.id,
                    hintContentId: mark.content_id,
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
            // enterButton={<Button style={{ background: ' rgb(250, 162, 0)' }}>Отмена</Button>}
          />
          {/* <Divider orientation="left">Результаты поиска</Divider> */}
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

        {newMark.coordinates ? (
          <div className="createPanel" style={{ width: isTabPhonebook ? '100%' : '30%' }}>
            <div style={{ height: '100%' }}>
              {isTabPhonebook ? (
                <LeftSquareOutlined
                  onClick={() => this.setState({ isTabPhonebook: false })}
                  style={{
                    position: 'absolute',
                    fontSize: 30,
                    color: '#1890ff',
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
                      <TextArea
                        placeholder="Вставте HTML"
                        onChange={this.createContentHtml.bind(this)}
                        allowClear
                        rows={10}
                      />
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
                {selectedMark.name}
              </Title>
              <Paragraph editable={edit}>{selectedMark.description}</Paragraph>
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
                        <div
                          style={{
                            display: this.state.loading ? 'flex' : 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Spin />
                        </div>
                        <TextArea
                          disabled={!edit}
                          placeholder="Вставте HTML"
                          allowClear
                          rows={10}
                          value={this.state.content.content_html ? this.state.content.content_html : ''}
                        />
                        <SyntaxHighlighter language="html" height="100px" style={docco} highlighter={'prism'}>
                          {this.state.content.content_html ? this.state.content.content_html : ''}
                        </SyntaxHighlighter>
                        {/* <CKEditor
                          disabled={!edit}
                          editor={ClassicEditor}
                          // data={this.state.content.content_html}
                          data={'<p></p>'}
                          onReady={(editor) => {
                            // You can store the "editor" and use when it is needed.
                            editor.setDat(this.state.content.content_html)
                          }}
                          height="200px"
                        /> */}
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
