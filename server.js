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
Page.hasMany(Page, { foreignKey: 'parentId', as: 'children'});
const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/pages/:id', async(req, res, next)=> {
  try {
    const page = await Page.findByPk(
      req.params.id,
      {
        include: [
          {
            model: Page,
            as: 'parent'
          },
          {
            model: Page,
            as: 'children'
          }
        ]
      }
    );
    res.send(page);
  }
  catch(ex){
    next(ex);
  }
});
app.get('/api/pages', async(req, res, next)=> {
  try {
    res.send(await Page.findAll({
      include: [
        {
          model: Page,
          as: 'parent'
        }
      ]
    }));
  }
  catch(ex){
    next(ex);
  }
});

app.post('/api/pages', async(req, res, next)=> {
  try {
    const page = await Page.create(req.body);
    res.status(201).send(page);
  }
  catch(ex){
    next(ex);
  }
});

app.delete('/api/pages/:id', async(req, res, next)=> {
  try {
    const page = await Page.findByPk(req.params.id);
    await page.destroy();
    res.sendStatus(204);
  }
  catch(ex){
    next(ex);
  }
});

app.put('/api/pages/:id', async(req, res, next)=> {
  try {
    const page = await Page.findByPk(req.params.id);
    await page.update(req.body);
    res.send(page);
  }
  catch(ex){
    next(ex);
  }
});


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
