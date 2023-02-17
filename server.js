const express = require('express');
const app = express();
const Sequelize = require('sequelize');
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_cms_db');

const Page = conn.define('page', {
  title: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  }
});

Page.belongsTo(Page, { as: 'parent'});


const port = process.env.PORT || 3000;
app.listen(port, async()=> {
  try {
    await conn.sync({ force: true });
    const [ home, about, founders, products ] = await Promise.all([
      Page.create({ title: 'Home' }),
      Page.create({ title: 'About' }),
      Page.create({ title: 'Founders' }),
      Page.create({ title: 'Products' }),
    ]);
    about.parentId = home.id;
    products.parentId = home.id;
    founders.parentId = about.id;
    await Promise.all([
      about.save(),
      products.save(),
      founders.save(),
      Page.create({ title: 'shirts', parentId: products.id }),
      Page.create({ title: 'pants', parentId: products.id }),
      Page.create({ title: 'socks', parentId: products.id })
    ]);

    console.log(`listening on port ${port}`);
  }
  catch(ex){
    console.log(ex);
  }
});
