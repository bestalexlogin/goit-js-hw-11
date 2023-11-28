import axios from 'axios';

const API_KEY = '20762645-ca024ef3775a46c729ffc2665';
const BASE_URL = 'https://pixabay.com/api/';

export default class axiosOnSearch {
  constructor() {
    this.queryText = '';
    this.page = 1;
  }

  async getPhoto() {
    const response = await axios.get(
      `${BASE_URL}?key=${API_KEY}&q=${this.queryText}&image_type=photo&orientation=horizontal&safesearch=true&page=${this.page}&per_page=40`
    );
    return response;
  }

  get query() {
    return this.queryText;
  }
  set query(newQuery) {
    this.queryText = newQuery;
  }

  resetPage() {
    this.page = 1;
  }
}
