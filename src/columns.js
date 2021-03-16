/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/display-name */
export default [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    render: (text) => <i>{text}</i>,
  },
  {
    title: 'Номер телефона',
    dataIndex: 'tel',
    key: 'tel',
    render: (text) => <b>{text}</b>,
  },
  {
    title: 'Имя',
    dataIndex: 'name',
    key: 'name',
  },
]
