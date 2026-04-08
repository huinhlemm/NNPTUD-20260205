const API = 'https://api.escuelajs.co/api/v1/products'

let products = []
let filtered = []
let currentPage = 1
let pageSize = 10
let sortState = { field: null, dir: 1 }

const tbody = document.getElementById('tbody')
const pagination = document.getElementById('pagination')
const searchInput = document.getElementById('search')
const pageSizeSelect = document.getElementById('pageSize')
const sortTitleBtn = document.getElementById('sortTitle')
const sortPriceBtn = document.getElementById('sortPrice')
const btnExport = document.getElementById('btnExport')
const btnCreate = document.getElementById('btnCreate')

const detailModalEl = document.getElementById('detailModal')
const detailModal = new bootstrap.Modal(detailModalEl)
const createModalEl = document.getElementById('createModal')
const createModal = new bootstrap.Modal(createModalEl)

async function fetchProducts(){
  const res = await fetch(API)
  products = await res.json()
  filtered = products.slice()
  render()
}

function render(){
  // apply search
  const q = searchInput.value.trim().toLowerCase()
  filtered = products.filter(p => p.title.toLowerCase().includes(q))

  // apply sort
  if(sortState.field){
    filtered.sort((a,b)=>{
      let av = a[sortState.field]
      let bv = b[sortState.field]
      if(typeof av === 'string') av = av.toLowerCase()
      if(typeof bv === 'string') bv = bv.toLowerCase()
      if(av < bv) return -1 * sortState.dir
      if(av > bv) return 1 * sortState.dir
      return 0
    })
  }

  // pagination
  pageSize = parseInt(pageSizeSelect.value,10)
  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if(currentPage > pages) currentPage = pages
  const start = (currentPage-1)*pageSize
  const view = filtered.slice(start, start+pageSize)

  tbody.innerHTML = ''
  view.forEach(p => {
    const tr = document.createElement('tr')
    tr.setAttribute('data-id', p.id)
    tr.setAttribute('title', p.description || '')
    tr.innerHTML = `
      <td>${p.id}</td>
      <td><img src="${(p.images && p.images[0])||''}" alt="" style="height:48px; width:48px; object-fit:cover"></td>
      <td class="title-cell">${escapeHtml(p.title)}</td>
      <td>${p.price}</td>
      <td>${p.category ? escapeHtml(p.category.name || p.category) : ''}</td>
    `
    tr.addEventListener('click', ()=> openDetail(p.id))
    tbody.appendChild(tr)
  })

  // pagination UI
  pagination.innerHTML = ''
  for(let i=1;i<=pages;i++){
    const li = document.createElement('li')
    li.className = 'page-item' + (i===currentPage ? ' active' : '')
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`
    li.addEventListener('click', (e)=>{ e.preventDefault(); currentPage=i; render() })
    pagination.appendChild(li)
  }

  // enable bootstrap tooltips for description on hover
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('#tbody tr'))
  tooltipTriggerList.forEach(function (el) {
    new bootstrap.Tooltip(el, {title: el.getAttribute('title'), container: 'body'})
  })
}

function escapeHtml(str){
  if(!str) return ''
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

searchInput.addEventListener('input', ()=>{ currentPage=1; render() })
pageSizeSelect.addEventListener('change', ()=>{ currentPage=1; render() })

sortTitleBtn.addEventListener('click', ()=>{
  if(sortState.field==='title') sortState.dir *= -1
  else { sortState.field='title'; sortState.dir = 1 }
  render()
})

sortPriceBtn.addEventListener('click', ()=>{
  if(sortState.field==='price') sortState.dir *= -1
  else { sortState.field='price'; sortState.dir = 1 }
  render()
})

btnExport.addEventListener('click', ()=>{
  exportCSV()
})

btnCreate.addEventListener('click', ()=> createModal.show())

async function openDetail(id){
  const p = await fetch(`${API}/${id}`).then(r=>r.json())
  document.getElementById('detailId').value = p.id
  document.getElementById('detailTitle').value = p.title
  document.getElementById('detailPrice').value = p.price
  document.getElementById('detailDescription').value = p.description
  document.getElementById('detailCategory').value = p.category ? (p.category.name || p.category) : ''
  document.getElementById('detailImages').value = (p.images || []).join(',')
  detailModal.show()
}

document.getElementById('saveBtn').addEventListener('click', async ()=>{
  const id = document.getElementById('detailId').value
  const payload = {
    title: document.getElementById('detailTitle').value,
    price: parseFloat(document.getElementById('detailPrice').value),
    description: document.getElementById('detailDescription').value,
    images: document.getElementById('detailImages').value.split(',').map(s=>s.trim()).filter(Boolean),
  }
  // For category, API expects categoryId or category object; we won't attempt to change category safely
  try{
    const res = await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    })
    if(!res.ok) throw new Error('Update failed')
    const updated = await res.json()
    // update local cache
    const idx = products.findIndex(x=>x.id==updated.id)
    if(idx>=0) products[idx] = updated
    detailModal.hide()
    render()
    alert('Updated successfully')
  }catch(err){
    alert('Error updating: '+err.message)
  }
})

document.getElementById('createSaveBtn').addEventListener('click', async ()=>{
  const payload = {
    title: document.getElementById('createTitle').value,
    price: parseFloat(document.getElementById('createPrice').value),
    description: document.getElementById('createDescription').value,
    images: document.getElementById('createImages').value.split(',').map(s=>s.trim()).filter(Boolean),
    categoryId: 1
  }
  try{
    const res = await fetch(API, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    })
    if(!res.ok) throw new Error('Create failed')
    const created = await res.json()
    products.unshift(created)
    createModal.hide()
    render()
    alert('Created successfully')
  }catch(err){
    alert('Error creating: '+err.message)
  }
})

function exportCSV(){
  // export currently visible rows
  const q = searchInput.value.trim().toLowerCase()
  const data = products.filter(p => p.title.toLowerCase().includes(q))
  // apply sort
  if(sortState.field){
    data.sort((a,b)=>{
      let av = a[sortState.field]
      let bv = b[sortState.field]
      if(typeof av === 'string') av = av.toLowerCase()
      if(typeof bv === 'string') bv = bv.toLowerCase()
      if(av < bv) return -1 * sortState.dir
      if(av > bv) return 1 * sortState.dir
      return 0
    })
  }
  const start = (currentPage-1)*pageSize
  const view = data.slice(start, start+pageSize)
  const rows = view.map(p=>({id:p.id, title:p.title, price:p.price, category: p.category? (p.category.name||p.category):'', images: (p.images||[]).join(';')}))
  const csv = [Object.keys(rows[0]||{}).join(',')].concat(rows.map(r=>Object.values(r).map(val=>`"${String(val).replace(/"/g,'""')}"`).join(','))).join('\n')
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'products_export.csv'
  a.click()
  URL.revokeObjectURL(url)
}

fetchProducts()
