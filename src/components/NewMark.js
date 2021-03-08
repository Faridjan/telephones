handleAddRow = () => {
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

;<div className="createContent">
   <Title level={3} style={{ textAlign: 'center' }}>
      Создание справочника
   </Title>
   <Input placeholder="Заголовок" allowClear onChange={this.onChangeTitle} />

   <TextArea placeholder="Описание" allowClear onChange={this.onChangeDesc} />

   <div className="createFooter">
      <Space size={20}>
         <Button onClick={this.handleAddRow} icon={<PlusOutlined />} shape="round" type="primary">
            Добавить телефон
         </Button>
      </Space>
      <Space size={20}>
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
      </Space>
   </div>
</div>
