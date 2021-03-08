import { isImmutable } from 'immutable'
import configApi from './api'

/**
 * Get method
 * @param url
 * @returns {Promise<R>}
 */
export const get = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const baseURL = configApi.API_ENDPOINT + '/v1' + url

    fetch(baseURL, {
      ...options,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          reject(new Error(data.message))
        } else if (data.errors) {
          reject(new Error(JSON.stringify(data.errors)))
        } else {
          resolve(data)
        }
      })
      .catch((error) => {
        return error
      })
  })
}

export const remove = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const baseURL = configApi.API_ENDPOINT + '/v1' + url

    fetch(baseURL, {
      ...options,
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          reject(new Error(data.message))
        } else if (data.errors) {
          reject(new Error(JSON.stringify(data.errors)))
        } else {
          resolve(data)
        }
      })
      .catch((error) => {
        return error
      })
  })
}

/**
 * Post method
 * @param url
 * @param data
 * @param method
 * @returns {Promise<R>}
 */
export const post = (url, data, method = 'POST') => {
  return new Promise((resolve, reject) => {
    // To JS Object
    if (isImmutable(data)) {
      data = data.toJS()
    }

    const baseURL = configApi.API_ENDPOINT + '/v1' + url

    fetch(baseURL, {
      method: method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: typeof data === 'object' ? JSON.stringify(data) : null,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) {
          reject(new Error(data.message))
        } else if (data.errors) {
          reject(new Error(JSON.stringify(data.errors)))
        } else {
          resolve(data)
        }
      })
      .catch((error) => {
        return error
      })
  })
}
