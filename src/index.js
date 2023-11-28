import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import Notiflix from 'notiflix';
import debounce from 'lodash.debounce';

import axiosOnSearch from './js/axios-photo';

const newAxios = new axiosOnSearch();
const lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});

const gallery = document.querySelector('.js-gallery');
const form = document.querySelector('#search-form');
const searchButton = document.querySelector('.js-search__button');
const target = document.querySelector('.js-guard');

searchButton.setAttribute('disabled', 'disabled');

const infinityScrollOptions = {
  root: null,
  rootMargin: '400px',
};

const observer = new IntersectionObserver(onScroll, infinityScrollOptions);

const endObserverOptions = {
  root: null,
  rootMargin: '100px',
};

const endObserver = new IntersectionObserver(
  onEndElementScroll,
  endObserverOptions
);

form.addEventListener('submit', handlerFormSubmit);

form.addEventListener('input', debounce(handlerFormInput, 300));

async function handlerFormSubmit(e) {
  observer.unobserve(target);
  newAxios.resetPage();
  gallery.innerHTML = '';
  e.preventDefault();

  newAxios.queryText = e.target.elements.searchQuery.value.trim();

  try {
    await getPhoto();
    const totalHits = localStorage.getItem('totalHits');

    if (Number(totalHits)) {
      Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`);
    }
  } catch (error) {
    console.log(error);
    Notiflix.Notify.failure('Oops, something went wrong');
  }
}

function handlerFormInput() {
  searchButton.removeAttribute('disabled', 'disabled');
}

async function onScroll(ent) {
  let totalPages = Number(localStorage.getItem('totalPages'));
  if (totalPages < newAxios.page) {
    observer.unobserve(target);

    if (gallery.lastElementChild) {
      endObserver.observe(gallery.lastElementChild);
    }

    return;
  }

  const isIntersecting = ent[0].isIntersecting;
  if (isIntersecting) {
    try {
      newAxios.page += 1;
      await getPhoto();
      // const { height: cardHeight } = document
      //   .querySelector('.gallery')
      //   .firstElementChild.getBoundingClientRect();

      // window.scrollBy({
      //   top: cardHeight * 5,
      //   behavior: 'smooth',
      // });
    } catch (error) {
      console.log(error);
      Notiflix.Notify.failure('Oops, something went wrong');
    }
  }
}

async function getPhoto() {
  localStorage.removeItem('totalHits');
  const result = await newAxios.getPhoto().then(response => {
    const hits = response.data.hits;
    const totalHits = response.data.totalHits;
    const totalPages = totalHits / 40;

    localStorage.setItem('totalPages', totalPages);
    localStorage.setItem('totalHits', totalHits);

    if (hits.length === 0) {
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
    }
    const markup = createMarkup(hits);
    gallery.insertAdjacentHTML('beforeend', markup);
    observer.observe(target);
    lightbox.refresh();
  });

  return result;
}

function createMarkup(hits) {
  return hits
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => `
      <div class="photo-card">
        <div class="thumb">
          <a href="${largeImageURL}">
            <img src="${webformatURL}" alt="${tags}" loading="lazy">
          </a>
        </div>
        <div class="info">
          <p class="info-item">
            <b>Likes</b>
            <span>${likes}</span>
          </p>
          <p class="info-item">
            <b>Views</b>
            <span>${views}</span>
          </p>
          <p class="info-item">
            <b>Comments</b>
            <span>${comments}</span>
          </p>
          <p class="info-item">
            <b>Downloads</b>
            <span>${downloads}</span>
          </p>
        </div>
      </div>
    `
    )
    .join('');
}

async function onEndElementScroll(e) {
  const isIntersecting = await e[0].isIntersecting;
  if (isIntersecting) {
    endObserver.unobserve(gallery.lastElementChild);
    Notiflix.Notify.warning(
      "We're sorry, but you've reached the end of search results."
    );
  }
}
