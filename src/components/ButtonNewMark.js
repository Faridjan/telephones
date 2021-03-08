<Title level={3} style={{ textAlign: 'center' }} editable={() => console.log('asdfasd')}>
{selectedMark.properties.getAll().hintTitle}
</Title>
<Paragraph editable={() => console.log('asdfasd')}>
{selectedMark.properties.getAll().hintContent}
</Paragraph>

<Tabs defaultActiveKey="1" type="card">
  <TabPane key="1" tab="Таблица" style={{ background: '#fff' }}>
    <Table
      columns={COULUMNS}
      dataSource={dataTable}
      locale={{
        emptyText: <Empty description="Справочник отсутствуeт" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
      }}
      rowClassName={() => 'editable-row'}
      bordered
    />
  </TabPane>
  <TabPane key="2" tab="HTML">
    Tab 2
  </TabPane>
  <TabPane key="3" tab="Изображения">
    Tab 2
  </TabPane>
  <TabPane key="4" tab="Файл">
    Tab 2
  </TabPane>
</Tabs>

<Space size={20}>
<Button onClick={this.handleAddRow} icon={<PlusOutlined />} shape="round" type="primary">
  Добавить телефон
</Button>
</Space>



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