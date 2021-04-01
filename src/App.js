import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { YMaps, Map, Clusterer, Placemark, ZoomControl, SearchControl, TypeSelector } from 'react-yandex-maps'
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
      creatingblack: false,
      creatingviolet: false,
      selectedMark: null,
      onpenModal: false,
      onpenModalRed: false,
      onpenModalYellow: false,
      onpenModalGreen: false,
      onpenModalblack: false,
      onpenModalviolet: false,
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
      message: 'Обрабатывается!',
      description: (
        <>
          {this.state.selectedMark ? (
            <strong>
              <div dangerouslySetInnerHTML={{ __html: this.state.selectedMark.description }} />
            </strong>
          ) : null}
          <Text>
            Данный населенный пункт был отмечен как находящийся в обработке.<br></br> Удаляйте только то что поставили
            именно вы!
          </Text>
          <br />
          <br />
          <Popconfirm
            placement="topRight"
            title="Подтверждаете удаление?"
            okText="Да"
            onConfirm={this.removeMark.bind(this)}
            cancelText="Нет"
          >
            <Button danger>Удалить точку</Button>
          </Popconfirm>
        </>
      ),
    })
  }

  openNotificationYellowMark() {
    notification.warning({
      key: 'updatable',
      icon: <InfoCircleOutlined style={{ color: '#d3c759' }} />,
      message: 'Пересекаются усилия!',
      description: (
        <>
          {this.state.selectedMark ? (
            <strong>
              <div dangerouslySetInnerHTML={{ __html: this.state.selectedMark.description }} />
            </strong>
          ) : null}
          <Text>
            Данный населенный пункт был отмечен как тот в котором пересекаются усилия и это вызывает проблемы.<br></br>
            Также желтая метка может использоваться как информационная.<br></br> Удаляйте только то что поставили именно
            вы!
          </Text>
          <br />
          <br />
          <Popconfirm
            placement="topRight"
            title="Подтверждаете удаление?"
            okText="Да"
            onConfirm={this.removeMark.bind(this)}
            cancelText="Нет"
          >
            <Button danger>Удалить точку</Button>
          </Popconfirm>
        </>
      ),
    })
  }

  openNotificationGreenMark() {
    notification.success({
      key: 'updatable',
      icon: <InfoCircleOutlined style={{ color: 'green' }} />,
      message: 'Нужна помощь!',
      description: (
        <>
          {this.state.selectedMark ? (
            <strong>
              <div dangerouslySetInnerHTML={{ __html: this.state.selectedMark.description }} />
            </strong>
          ) : null}
          <Text>
            В этом населенном пункте требуется помошь в поиске телефоных номеров.<br></br>Если у вас есть возможность
            помочь, можете это сделать.
          </Text>
          <br />
          <br />
          <Popconfirm
            placement="topRight"
            title="Подтверждаете удаление?"
            okText="Да"
            onConfirm={this.removeMark.bind(this)}
            cancelText="Нет"
          >
            <Button danger>Удалить точку</Button>
          </Popconfirm>
          <Button type="default" style={{ position: 'absolute' }} onClick={() => this.setState({ creating: true })}>
            Справочник найден
          </Button>
        </>
      ),
    })
  }

  openNotificationvioletMark() {
    notification.error({
      key: 'updatable',
      icon: <InfoCircleOutlined style={{ color: 'violet' }} />,
      message: 'Правило набора',
      description: (
        <>
          {this.state.selectedMark ? (
            <strong>
              <div dangerouslySetInnerHTML={{ __html: this.state.selectedMark.name }} />
            </strong>
          ) : null}
          <Text>
            Метки фиолетового цвета содержат название населенного пункта, название района, и правило набора номера
            абонента, где последние XXXXX - это пятизначный номер абонента.<br></br> Без надобности не удаляйте! Только
            для коректировки.
          </Text>
          <br />
          <br />
          <Popconfirm
            placement="topRight"
            title="Все равно удалить?"
            okText="Да"
            onConfirm={this.removeMark.bind(this)}
            cancelText="Нет"
          >
            <Button danger>Удалить точку</Button>
          </Popconfirm>
        </>
      ),
    })
  }

  openNotificationblackMark() {
    notification.error({
      key: 'updatable',
      icon: <InfoCircleOutlined style={{ color: 'black' }} />,
      message: 'Ликвидированный',
      description: (
        <>
          {this.state.selectedMark ? (
            <strong>
              <div dangerouslySetInnerHTML={{ __html: this.state.selectedMark.description }} />
            </strong>
          ) : null}
          <Text>
            Метки черного цвета означают что данный населенный пункт ликвидирован, и неизвестно проживает ли в нем кто
            нибудь. Без надобности не удаляйте!
          </Text>
          <br />
          <br />
          <Popconfirm
            placement="topRight"
            title="Все равно удалить?"
            okText="Да"
            onConfirm={this.removeMark.bind(this)}
            cancelText="Нет"
          >
            <Button danger>Удалить точку</Button>
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

    // Установка цветной точки по нажатию на карте
    if (this.state.creating && !this.state.newMark.id) {
      const newMarkType = this.state.newMark.type
      const colorMark =
        newMarkType === 'black'
          ? 'black'
          : newMarkType === 'red'
          ? 'red'
          : newMarkType === 'yellow'
          ? 'yellow'
          : newMarkType === 'green'
          ? 'green'
          : newMarkType === 'violet'
          ? 'violet'
          : 'blue'

      const colorMarkType = 'islands#' + colorMark + 'CircleDotIcon'

      this.setState((state) => {
        const newMark = state.newMark

        newMark.id = event.get('coords').join('')
        newMark.type = newMarkType || 'base'
        newMark.options.preset = colorMarkType
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
      } else if (options && options.preset === 'islands#violetCircleDotIcon') {
        this.openNotificationvioletMark()
      } else if (options && options.preset === 'islands#blackCircleDotIcon') {
        this.openNotificationblackMark()
      } else {
        this.fetchContent()
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
      message.error('Укажите название населенного пункта')
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
              creatingblack: false,
              creatingviolet: false,
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
      title: 'Отменить изменения?',
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

  tabOnClick(tabKey) {
    this.fetchContent()
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
        <Menu.Item key="0" onClick={() => this.setState({ creating: true })}>
          Добавить справочник
        </Menu.Item>
        <Menu.Item
          key="1"
          onClick={() => this.setState({ creating: true, newMark: { ...this.state.newMark, type: 'green' } })}
        >
          Попросить помошь
        </Menu.Item>
        <Menu.Item
          key="2"
          onClick={() => this.setState({ creating: true, newMark: { ...this.state.newMark, type: 'yellow' } })}
        >
          Пересекаются усилия
        </Menu.Item>
        <Menu.Item
          key="3"
          onClick={() => this.setState({ creating: true, newMark: { ...this.state.newMark, type: 'red' } })}
        >
          Отметить как занятый
        </Menu.Item>
        <Menu.Item
          key="3"
          onClick={() => this.setState({ creating: true, newMark: { ...this.state.newMark, type: 'violet' } })}
        >
          Добавить телеф. код
        </Menu.Item>
        <Menu.Item
          key="4"
          onClick={() => this.setState({ creating: true, newMark: { ...this.state.newMark, type: 'black' } })}
        >
          Ликвидированный
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={() => this.setState({ onpenModalguide: true })} key="5">
          Нет справочника
        </Menu.Item>
        <Menu.Item onClick={() => this.setState({ onpenModalhelpProject: true })} key="6">
          Поддержать проект
        </Menu.Item>
        <Menu.Item onClick={() => this.setState({ onpenModalhelpUser: true })} key="7">
          Для разработчиков
        </Menu.Item>
        <Menu.Item onClick={() => this.setState({ onpenModalhelp: true })} key="8">
          Инструкция
        </Menu.Item>
      </Menu>
    )

    const menu1 = (
      <Menu>
        <Menu.Item key="9">
          <input type="checkbox" Скрыть актуальные справочники />
        </Menu.Item>
        <Menu.Item key="10">
          <input type="checkbox" />
          Скрыть нас. пункты где нужна помошь
        </Menu.Item>
        <Menu.Item key="11">
          <input type="checkbox" />
          Скрыть нас. пункты где пересекаются усилия
        </Menu.Item>
        <Menu.Item key="12">
          <input type="checkbox" />
          Скрыть нас. пункты находящиеся в обработке
        </Menu.Item>
        <Menu.Item key="13">
          <input type="checkbox" />
          Скрыть правила набора телефонных кодов
        </Menu.Item>
        <Menu.Item key="14">
          <input type="checkbox" />
          Скрыть ликвидированные нас. пункты
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
          title="Примеры нахождения телефонных номеров, при отсутствии телефонных справочников"
          width="90%"
          height="630vh"
          style={{
            marginBottom: 60,
          }}
          visible={this.state.onpenModalguide}
          onOk={() => this.setState({ onpenModalguide: false })}
          okText="Скачать заготовку таблицы"
          cancelText="Закрыть"
          onCancel={() => this.setState({ onpenModalguide: false })}
        >
          <div dangerouslySetInnerHTML={{ __html: guide }} />
        </Modal>

        <Modal
          title="Сайт предназначен для обмена информацией, где каждый может внести свой вклад"
          width="90%"
          height="150vh"
          style={{
            marginBottom: 60,
          }}
          visible={this.state.onpenModalhelp}
          onOk={() => this.setState({ onpenModalhelp: false })}
          okText="OK"
          cancelText="Закрыть"
          onCancel={() => this.setState({ onpenModalhelp: false })}
        >
          <Text>
            Сайт находится в процессе доработки и улучшения и содержит некоторые ошибки, которые можно устранить
            обновлением страницы<br></br>
            <br></br> ПРИ ДОБАВЛЕНИИ ЛЮБОЙ ИНФОРМАЦИИ ПРИДЕРЖИВАЙТЕСЬ ТОГО ПОДХОДА КОТОРЫЙ УЖЕ ПРИМЕНЯЕТСЯ ЧТОБЫ БЫЛ
            ПОРЯДОК!!! ДЛЯ ЭТОГО МОЖНО ПОСМОТРЕТЬ КАК ИМЕННО ЗАПОЛНЕНЫ РАЗЛИЧНЫЕ ПОЛЯ. НАПРИМЕР: ПРИ ДОБАВЛЕНИИ
            ДИАПАЗОНОВ НОМЕРОВ МОЖНО ПРИДЕРЖИВАТСЯ ТАКОГО ПОДХОДА<br></br>
            <br></br> Телефонный код 871636<br></br> с 9-41-00 до 9-41-99<br></br> с 9-42-00 до 9-42-99<br></br> с
            9-43-00 до 9-43-99<br></br> с 9-44-00 до 9-44-99<br></br> с 9-45-00 до 9-45-99
            <br></br> с 9-46-00 до 9-46-99<br></br> с 9-47-00 до 9-47-99<br></br>
            для перевода курсора на новую строку удерживайте клавишу SHIFT и затем ENTER (ввод) это позволит избежать
            разрыва между строками<br></br>При добавлении справочника в виде Exel таблицы (это стандарт для данного
            сайта) при ее создании используйте шрифт Arial размер 10<br></br> При этом колонку номер позиции выделяйте
            курсивом а колонку номер телефона полужирным шрифтом<br></br> Над колонкой номер позиции необходимо
            поставить id а над колонкой номер телефона необходимо поставить tel иначе таблица не считается<br></br>Если
            у вас есть бумажный справочник, и вы можете им поделится, позаботьтесь о том чтобы перевести его в Exel
            <br></br>Оставив только номера позиции и номера телефонов, не выставля адреса и ФИО так как это нарушает
            закон о защите персональных данных.<br></br>
            <br></br>ПРИ УСТАНОВКЕ КРАСНОЙ ЗЕЛЕНОЙ И ЖЕЛТОЙ МЕТКИ ВНАЧАЛЕ ЗАПОЛНИТЕ ПОЛЕ НАЗВАНИЕ ПОСЕЛКА ВО ВТОРОМ ПОЛЕ
            УКАЖИТЕ КТО ЕЕ ПОСТАВИЛ НАПРИМЕР:<br></br>
            Жесказган, Русское<br></br>
            <br></br>ПРИ УСТАНОВКЕ ТЕЛЕФОННОГО КОДА ОБЯЗАТЕЛЬНО УКАЖИТЕ НАЗВАНИЕ ПОСЕЛКА РАЙОН К КОТОРОМУ ОН ПРИНАДЛЕЖИТ
            И САМ КОД ДОБАВИВ В КОНЦЕ XXXXX НАПРИМЕР:<br></br> Форт-Шевченко (Тупкараганский р-н) 8 72938 ХХХХХ
            <br></br>
            <br></br>
            Точки на карте имеют следующие значения:<br></br>
            Синяя: актуальный справочник <br></br>
            Зеленая: в этом населенном пункте требуется помошь в поиске телефонных номеров<br></br>
            Желтая: в этом населенном пункте пересекаются усилия разных собраний<br></br>
            Красная: этот населенный пункт в данный момент обрабатывается<br></br>Описание опций меню:<br></br>
            Фиолетовая: правило набора телефонного номера в данном населенном пункте<br></br>Черная: ликвидированный
            населенный пункт<br></br>
            {/* ДОБАВИТЬ СПРАВОЧНИК:<br></br>
              <i>
                Этот пункт предназначен для добавления нового справочника на карту, после нажатия на Добавить справочник
                выберите населенный пункт к которому относится справочник нажмите левой кнопкой мыши на карте: в
                выбраной позиции будет установлена синяя точка и затем в открывшемся окне введите название населенного
                пункта, его описание и добавьте необходимую инфформацию.<br></br> Если информация содержит только
                телефонный код и диапазоны номеров ее можно добавить прямо в описание, если информация представлена в
                виде ексель таблицы нажмите на слово справочник и загрузите таблицу
                <br></br>
              </i>
              ПОПРОСИТЬ ПОМОШЬ
              <br></br>
              <i>
                Этот пункт предназначен для того чтобы все участники могли увидеть что в отмеченном населенном пункте
                нужна помошь в поиске телефонных номеров, после нажатия на Попросить помощь выберите населенный пункт на
                карте нажмите на нем левой кнопкой мыши: в выбраной позиции будет установлена зеленая точка, и затем в
                открывщемся окне введите название населенного пункта, его описание и добавьте необходимую инфформацию.
              </i>
              <br></br> ПЕРЕСЕКАЮТСЯ УСИЛИЯ<br></br>
              <i>
                Этот пункт предназначен для того чтобы все участники могли увидеть что в отмеченном населенном пункте
                пересекаются усилия разных собраний и это вызывает проблемы, после нажатия на Пересекаются усилия
                выберите населенный пункт на карте нажмите на нем левой кнопкой мыши: в выбраной позиции будет
                установлена желтая точка, и затем в открывщемся окне введите название населенного пункта, его описание и
                добавьте необходимую инфформацию.
              </i>
              <br></br>
              ОТМЕТИТЬ КАК ЗАНЯТЫЙ<br></br>
              <i>
                Этот пункт предназначен для того чтобы все участники могли увидеть что в отмеченном населенном пункте
                ведется обработка, после нажатия на Отметить как занятый выберите населенный пункт на карте нажмите на
                нем левой кнопкой мыши: в выбраной позиции будет установлена красная точка, и затем в открывщемся окне
                введите название населенного пункта, его описание и добавьте необходимую инфформацию.
              </i>
            </b> */}
          </Text>
        </Modal>
        <Modal
          title="Поддержка проекта, по желанию"
          width="30%"
          height="120vh"
          style={{
            marginBottom: 60,
          }}
          visible={this.state.onpenModalhelpProject}
          onOk={() => this.setState({ onpenModalhelpProject: false })}
          okText="OK"
          cancelText="Закрыть"
          onCancel={() => this.setState({ onpenModalhelpProject: false })}
        >
          <Text>
            Данный ресурс размешен на Российском хостинге https://beget.com/ru.<br></br>Для поддержания сайта в рабочем
            состоянии требуется наличие положительного баланса на акаунте p70578v9<br></br> (Стоимость аренды 300р или
            1686 тг в месяц) Логин и пароль для входа: p70578v9, jQqtxYe7<br></br>
            Оплату можно произвести банковской картой, в которой разблокированы интернет покупки <br></br>
          </Text>
        </Modal>
        <Modal
          title="Информация для разработчиков"
          width="70%"
          height="120vh"
          style={{
            marginBottom: 60,
          }}
          visible={this.state.onpenModalhelpUser}
          onOk={() => this.setState({ onpenModalhelpUser: false })}
          okText="OK"
          cancelText="Закрыть"
          onCancel={() => this.setState({ onpenModalhelpUser: false })}
        >
          <Text>
            Исходный код сайта находится по адресу: https://github.com/Faridjan/<br></br>Пример редактирования
            клиентской части кода на Windows 7<br></br>1 Скачиваем и устанавливаем среду разработки Visual Studio Code
            <br></br> 2 Скачиваем с https://github.com/Faridjan/telephones_front ZIP архив со всеми необходимыми
            компонентами
            <br></br> 3 Распаковываем этот архив например в папку site находящуюся на диске D:<br></br>4 Удаляем среди
            распакованых файлов файл package-lock (это важно)<br></br>5 В терминале (cmd) набираем команду{' '}
            <b>cd D:/site</b> затем <b>D:</b> появится <b>D:/site</b> набираем <b>npm i</b> и ждем завершения
            <br></br>6 набираем <b>npm start</b> в браузере откроется страница localhost:3000<br></br>Теперь все
            изменения кода сделанные в Visual Studio Code будут видны в браузере<br></br>
            <br></br>Заливка исправленного кода на хостинг<br></br>1 Останавливаем работу терминала (cmd) удерживая ctrl
            и нажимая клавишу C<br></br>2 снова удаляем из папки site файл package-lock (это важно) и в терминале (cmd)
            набираем команду <b>npm run build</b> ждем завершения, при ошибке повторяем команду<br></br>3 в папке site
            открываем папку build и все что там находится запаковываем в ZIP архив<br></br>4 Заходим на
            https://beget.com/ru Логин и пароль для входа: p70578v9, jQqtxYe7<br></br>5 Переходим в Файловый менеджер,
            открываем папку p70578v9 затем открываем public_html и удаляем все содержимое (удерживая Shifr нажимаем
            левой копкой мыши на самом вернем и затем правой кнопкой мыши на самом нижнем, выбираем удалить)<br></br>6
            Сверху нажимаем на загрузить файлы, в открывщемся окне нажимаем на Browser и выбираем наш ZIP архив и
            нажимаем загрузить
            <br></br>7 После загрузки нажимаем на загруженый архив и выбираем распаковать. Все, сайт обновлен<br></br>
            Выходим из beget.com/ru
            <br></br>
          </Text>
        </Modal>
        <Modal
          title="То что хотелось бы сделать"
          width="90%"
          height="120vh"
          style={{
            marginBottom: 60,
          }}
          visible={this.state.onpenModalprocces}
          onOk={() => this.setState({ onpenModalprocces: false })}
          okText="OK"
          onCancel={() => this.setState({ onpenModalprocces: false })}
          cancelText="Отмена"
        >
          <Text>
            САМОЕ ВАЖНОЕ <br></br>1 Сделать аутентификацию вход на сайт по уникальному номеру (номер собрания) и общему
            паролю, затем при установке любой метки уникальный номер автоматически вставляется в поле заполнения формы
            это позволит в дальнейшем производить фильтрацию оставляя видимыми только те метки которые поставлены
            конкретным участником
            <br></br> 2 Добавить меню фильтра меток. Ссылка на фильтрацию меток
            https://yandex.ru/dev/maps/jsbox/2.1/object_manager_filter также html в чате<br></br> 3 Заменить карту на
            Google или 2 GIS.
            <br></br>4 при установке любой метки при выборе места на карте привязать к указателю мыши ВЫБРАТЬ ПОЗИЦИЮ
            <br></br>5 Класная опция в чате по наведению на карту показывает название страны области и района тоже
            хотелось бы добавить<br></br>
            <br></br>ВТОРОСТЕПЕННОЕ<br></br> 1 при наведении на красную желтую и зеленую метку показывать не только ее
            название но и уникальный номер (это позволит сразу видеть кто ее установил не нажимая на нее)
            <br></br> 2 Сделать номера более читаемыми Заменить 31275 на 3-12-75<br></br> 3 В руководстве исправить
            таблицу (непрозвоненые сотни окрасились в серый цвет сделать прозрачными) и к кнопке скачать заготовку
            таблицы подвязать скачивание пустой заготовки
            <br></br>4 Убрать из слоев опции Спутник и Панорамы
            <br></br>5 в цветных метках при переходе к окну добавить во второе поле Введите описание и не сохранять
            метку пока описание не заполнено с выводом предупреждения. и под полем информационная надпись отдельно для
            каждого цвета<br></br>6 Закрывать инф окно при нажатии на карту<br></br>7 добавить второй поиск по карте
            <br></br>8 При скачивание справочника заменить Demo.xlsc На название поселка.xlsc<br></br>9 класная опция в
            чате показывает 2 местоположение 1 вычисленное по ip и 2 вычисленое средствами браузера чтобы участники
            понимали насколько легко вычислить их местоположение
            <br></br>ОШИБКИ<br></br> 1 При нажатии в поиске на значок лупы при пустом поле выходит ошибка, происходит
            зависание страницы(даже не при пустом кажется тоже выйдет ошибка) и поле поиска не очищается после выбора
            справочника (если с большой буквы поиск перестает работать) частые ошибки при нажатии крестика в поиске
            происходит зависание страницы<br></br>2 Название метки Златополье не отправляется, златополье с маленькой
            буквы отправляется, Федоровка не отправляется Федоровка. (с точкой) отправляется<br></br> 3 При переходе на
            пустой справочник кнопки ОК и ОТМЕНА двигаются вместе со страницей, зафиксировать кнопки.
            <br></br>4 В инф окне зеленой метки немного раздвинуть кнопки Удалить и Справочник найден
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
                  // iconCaption: mark.description,
                  // balloonContent: mark.description,
                }}
                options={{
                  preset: mark.options ? mark.options.preset : 'islands#blueCircleDotIcon',

                  // cursor: 'pointer',
                  // visible: 'false',
                  draggable: mark.id === newMark.id,
                }}
              />
            ))}
            <SearchControl />
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
                fontSize: 20,
                position: 'absolute',
                left: '10%',
                bottom: -30,
                fontWeight: 800,
                color: '#000',
                background: '#0ff',
                padding: 6,
                borderRadius: 1,
              }}
              onClick={(e) => e.preventDefault()}
            />
          </Dropdown>
          <Dropdown overlay={menu1} trigger={['click']}>
            <MenuOutlined
              style={{
                fontSize: 20,
                position: 'absolute',
                left: '60%',
                bottom: -30,
                fontWeight: 800,
                color: '#000',
                background: '#f0f',
                padding: 6,
                borderRadius: 1,
              }}
              onClick={(e) => e.preventDefault()}
            />
          </Dropdown>
        </div>
        <div
          style={{
            position: 'absolute',
            right: '115px',
            left: '74%',
            color: 'green',
            top: 8,
            zIndex: 4,
            width: 250,
          }}
        >
          <Search
            placeholder="Найти из того что есть"
            onSearch={this.onSearch.bind(this)}
            allowClear={true}
            onChange={this.onSearch.bind(this)}
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

        {/* Панель установки синей точки */}
        {newMark.coordinates ? (
          <div className="createPanel" style={{ width: '30%' }}>
            <div>
              <Title level={3}>{this.state.newMark.type === 'base' ? 'Добавление справочника' : 'Описание'}</Title>

              <div style={{ display: 'block' }}>
                <Input
                  placeholder="Название населенного пункта"
                  ref={this.inputNameRef}
                  allowClear
                  onChange={this.onChangeTitle.bind(this)}
                />
                <br />
                <br />
                {/* <Input
                  placeholder="Номер собрания (необходим для фильтра)"
                  ref={this.inputNameRef}
                  allowClear
                  onChange={this.onChangeTitle.bind(this)}
                /> */}
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

              {newMark.type === 'base' ? (
                <Tabs onTabClick={this.tabOnClick.bind(this)}>
                  <TabPane>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        this.readExcel(file)
                      }}
                    />
                    <br />
                    <br />
                  </TabPane>
                </Tabs>
              ) : null}
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
                  title="Отменить изменения?"
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

        {/* Действие по нажатию на справочник */}
        {selectedMark && selectedMark.options.preset === 'islands#blueCircleDotIcon' ? (
          <div className="createPanel" style={{ width: '30%' }}>
            <div>
              <Title level={3} style={{ textAlign: 'center' }}>
                {selectedMark.name}
              </Title>

              <div dangerouslySetInnerHTML={createMarkup()} />
              <div>
                {this.state.loading ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <Spin />
                  </div>
                ) : (
                  <>
                    {this.state.content.content_json ? (
                      <Button
                        style={{
                          margin: '30px 0 10px',
                        }}
                        onClick={this.exportJS.bind(this)}
                      >
                        Скачать в EXCEL
                      </Button>
                    ) : null}
                    <Table
                      columns={COULUMNS}
                      dataSource={content.content_json}
                      locale={{
                        emptyText: <Empty description="Справочник отсутствуeт" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
                      }}
                      rowClassName={() => 'editable-row'}
                      pagination={false}
                    />
                  </>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                marginTop: 30,
                justifyContent: 'flex-end',
              }}
            >
              <Popconfirm
                placement="topRight"
                title="Вы удаляете справочник!"
                okText="Да"
                onConfirm={this.removeMark.bind(this)}
                cancelText="Нет"
              >
                <Button danger>Удалить</Button>
              </Popconfirm>
            </div>
          </div>
        ) : null}

        <Button
          type="default"
          style={{
            position: 'absolute',
            top: 8,
            left: '68.5%',
            bottom: 583,
            borderRadius: 1,
            transform: 'translate(-50%, 0)',
          }}
          shape="round"
          disabled={creating}
          onClick={() => this.setState({ onpenModal: true })}
        >
          Найти на карте
        </Button>
        <Button
          type="default"
          style={{
            position: 'absolute',

            left: '6%',
            bottom: 10,
            borderRadius: 1,
            transform: 'translate(-50%, 0)',
          }}
          shape="round"
          disabled={creating}
          onClick={() => this.setState({ onpenModalprocces: true })}
        >
          Доработать
        </Button>
      </div>
    )
  }
}

export default App
