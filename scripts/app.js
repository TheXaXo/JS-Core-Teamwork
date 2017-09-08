$(() => {
    // let category = start();

    //function stupedUser() {
    //    //auth.loginAsStupedUser(1, 2).then(function (data) {
    //        sessionStorage.setItem('authtoken', data._kmd.authtoken);
    //    });
    //}

    //async function start() {
    //    await stupedUser();
    //    await app.run();
    //    let b = await brandService.getAllBrands();
    //    return b;
    //}

    const app = Sammy('#main', function () {
        Handlebars.registerHelper("len", function (json) {
            return Object.keys(json).length;
        });

        this.use('Handlebars', 'hbs');

        this.get('#/home', displayHome);

        this.get('index.html', displayHome);

        this.get('#/login', displayLogin);

        this.post('#/login', handleLogin);

        this.get('#/registration', displayRegister);

        this.post('#/registration', handleRegister);

        this.get('#/logout', handleLogout);

        this.get('#/user/details/:username', displayUserProfile);

        this.get('#/user/edit/:username', displayEditUser);

        this.post('#/user/edit/:username', handleEditUser);

        this.get('#/create', displayCreateAd);

        this.post('#/create', handleCreateAd);

        this.get('#/ads/details/:id', displayDetailsAd);

        this.get('#/edit/:id', displayEditAd);

        this.post('#/edit/:id', handleEditAd);

        this.get('#/delete/:id', function (ctx) {
            let adId = ctx.params.id.substr(1);
            adsService.removeAd(adId)
                .then(function (adInfo) {
                    console.log(adInfo);
                    notifications.showInfo(`Your ad is deleted.`);
                    ctx.redirect('#/home')
                }).catch(auth.handleError);
        });

        this.get('#/comment/:id', publishAdComment);

        this.get('#/user/messages', displayMessages);

        this.get('#/user/message/:id', displayMessageThread);

        this.post('#/user/message/:id', handleSendMessageInThread);

        this.get('#/message/send/:username', displaySendMsg);

        this.post('#/message/send/:username', handleNewMessageThread);

        this.get('#/user/ads/:username', displayUserAds);

        this.get('#/user/ban/:username', banUser);

        this.get('#/user/unban/:username', unBanUser);

        this.get('#/admin/brands', displayBrands);

        this.get('#/admin/brands/new', displayNewBrand);

        this.post('#/admin/brands/new', handleNewBrand);

        this.get('#/admin/brands/edit/:name', displayEditBrand);

        this.post('#/admin/brands/edit/:brand', handleEditBrand);

        this.get('#/admin/brands/delete/:name', deleteBrand);

        this.get('#/admin/models', displayModels);

        this.get('#/admin/model/delete/:brand/:name', deleteModel);

        this.get('#/admin/models/add/:name', displayAddModel);

        this.post('#/admin/models/add/:brand', handleAddModel);

        this.get('/admin/model/edit/:brand/:model', displayEditModel);

        this.post('#/admin/models/edit/:brand/:model', handleEditModel);

        this.post('#/ads/details/add/comments/:id', handleAdsComment);

        this.get('#/ads/comments/delete/:id/:ad_id', handleDeleteComment);

        this.get('#/search/:query', displaySearch);

        function handleDeleteComment(ctx) {
            let adsId = ctx.params.id;
            let commentId = ctx.params.ad_id;
            adsService.removeComment(commentId)
                .then(function () {
                    notifications.showInfo('Comment deleted.');
                    ctx.redirect('#/ads/details/' + adsId)
                }).catch(notifications.handleError)
        }

        function handleAdsComment(ctx) {
            let id = ctx.params.id;
            let username = sessionStorage.getItem('username');
            adsService.addComment(id, username, sessionStorage.getItem('avatar'), ctx.params.comment)
                .then(function () {
                    notifications.showInfo('Comment added.');
                    ctx.redirect(`#/ads/details/${id}`)
                }).catch(notifications.handleError);
        }

        function handleEditModel(ctx) {
            let brand = ctx.params.brand;
            let oldModel = ctx.params.model;
            let newModel = ctx.params.name;

            brandService.getBrand(brand).then(function (brandInfo) {
                for (let modelInfo in brandInfo[0].models) {
                    if (brandInfo[0].models[modelInfo] === oldModel) {
                        brandInfo[0].models[modelInfo] = newModel;
                    }
                }
                let data = {"name": brandInfo[0].name, "models": brandInfo[0].models};
                brandService.editBrand(brandInfo[0]._id, data).then(function (info) {
                    ctx.redirect(`#/admin/models`)
                });

            })
        }

        function displayEditModel(ctx) {
            ctx.model = ctx.params.model;
            ctx.brand = ctx.params.brand;

            let partialsObject = getCommonElements(ctx);
            partialsObject["content"] = './temp/admin/models/edit.hbs';
            ctx.loadPartials(partialsObject).then(function () {
                this.partial('./temp/common/main.hbs');
            });
        }

        function handleAddModel(ctx) {
            let modelName = ctx.params.name;
            let brand = ctx.params.brand;
            let rString = Math.random().toString(36).slice(2);
            brandService.getBrand(brand).then(function (brandInfo) {
                if (!brandInfo[0].models) {
                    brandInfo[0]['models'] = {rString: modelName};
                } else {
                    brandInfo[0].models[rString] = modelName;
                }
                let data = {"name": brandInfo[0].name, "models": brandInfo[0].models};
                brandService.editBrand(brandInfo[0]._id, data).then(function (info) {
                    notifications.showInfo('Dobaven uspeshno');
                    ctx.redirect(`#/admin/models`)
                });
            }).catch(notifications.handleError);
        }

        function displayAddModel(ctx) {

            ctx.name = ctx.params.name;
            let partialsObject = getCommonElements(ctx);
            partialsObject["content"] = './temp/admin/models/add.hbs';
            ctx.loadPartials(partialsObject).then(function () {
                this.partial('./temp/common/main.hbs');
            });
        }

        function deleteModel(ctx) {
            let modelName = ctx.params.name;
            let brandName = ctx.params.brand;
            brandService.getBrand(brandName).then(function (brandInfo) {
                for (let model in brandInfo[0].models) {
                    if (brandInfo[0].models[model] === modelName) {
                        delete brandInfo[0].models[model];
                    }
                }
                let data = {"name": brandInfo[0].name, "models": brandInfo[0].models};
                brandService.editBrand(brandInfo[0]._id, data).then(function (info) {
                    ctx.redirect(`#/admin/models`)
                });

            })
        }

        function displayModels(ctx) {
            brandService.getAllBrands().then(function (data) {
                ctx.data = data;
                let partialsObject = getCommonElements(ctx);
                partialsObject["model"] = './temp/admin/models/model.hbs';
                partialsObject["content"] = './temp/admin/models/index.hbs';
                ctx.loadPartials(partialsObject).then(function () {
                    this.partial('./temp/common/main.hbs');
                });
            }).catch(notifications.handleError)
        }

        function deleteBrand(ctx) {
            let brandName = {"name": ctx.params.name};
            brandService.deleteBrand(ctx.params.name).then(function (brandInfo) {
                notifications.showInfo('Successfully deleted brand');
                ctx.redirect('#/admin/brands');
            }).catch(notifications.handleError);
        }

        function handleEditBrand(ctx) {
            let brandName = {"name": ctx.params.name};
            brandService.getBrand(ctx.params.brand).then(function (brandInfo) {
                brandService.editBrand(brandInfo[0]._id, brandName).then(function (data) {
                    notifications.showInfo('Successfully added brand');
                    ctx.redirect('#/admin/brands');
                })
            }).catch(notifications.handleError);
        }

        function displayEditBrand(ctx) {
            ctx.name = ctx.params.name;
            let partialsObject = getCommonElements(ctx);
            partialsObject["content"] = './temp/admin/brands/edit.hbs';
            ctx.loadPartials(partialsObject).then(function () {
                this.partial('./temp/common/main.hbs');
            });
        }

        function handleNewBrand(ctx) {
            let brandName = {"name": ctx.params.name};
            brandService.createBrand(brandName).then(function () {
                notifications.showInfo('Successfully added brand');
                ctx.redirect('#/admin/brands');
            }).catch(notifications.handleError);
        }

        function displayNewBrand(ctx) {
            if (auth.isAuthed()) {
                let partialsObject = getCommonElements(ctx);
                partialsObject["content"] = './temp/admin/brands/new.hbs';
                ctx.loadPartials(partialsObject).then(function () {
                    this.partial('./temp/common/main.hbs');
                });
            }
        }

        function displayBrands(ctx) {
            brandService.getAllBrands().then(function (data) {
                ctx.data = data;
                ctx.length = data.length;
                if (auth.isAuthed()) {
                    let partialsObject = getCommonElements(ctx);
                    partialsObject["content"] = './temp/admin/brands/index.hbs';
                    partialsObject["brand"] = './temp/admin/brands/brand.hbs';
                    ctx.loadPartials(partialsObject).then(function () {
                        this.partial('./temp/common/main.hbs');
                    });
                }
            });

        }

        function unBanUser(ctx) {
            let username = ctx.params.username;
            auth.getUserInfo(username).then(function (userInfo) {
                userInfo[0].isBlocked = '';
                auth.banUser(userInfo[0]._id, userInfo[0]).then(function (data) {
                    notifications.showInfo(username + ' is active again');
                    ctx.redirect(`#/user/details/${userInfo[0].username}`);
                })
            }).catch(auth.handleError)
        }

        function banUser(ctx) {
            let username = ctx.params.username;
            auth.getUserInfo(username).then(function (userInfo) {
                userInfo[0].isBlocked = 'true';
                auth.banUser(userInfo[0]._id, userInfo[0]).then(function (data) {
                    ctx.redirect(`#/user/details/${userInfo[0].username}`);
                })
            }).catch(auth.handleError)
        }

        function displayUserAds(ctx) {
            auth.getUserInfo(ctx.params.username).then(function (data) {
                adsService.getUserAds(data[0]._id).then(function (ads) {
                    /*for (let ad of ads) {
                     let images = JSON.parse(ad.images);
                     if (images[0] === "") {
                     ad.image = 'https://www.vipspatel.com/wp-content/uploads/2017/04/no_image_available_300x300.jpg';
                     } else {
                     ad.image = images[0];
                     }
                     }*/
                    ctx.ads = ads;

                    let partialsObject = getCommonElements(ctx);
                    partialsObject["content"] = './temp/profile/ads/index.hbs';
                    ctx.loadPartials(partialsObject).then(function () {
                        this.partial('./temp/common/main.hbs');
                    });
                })
            })
        }

        function displayHome(ctx) {
            brandService.getAllBrands().then(function (categories) {
                ctx.category = categories;
                adsService.getAds().then(function (data) {
                    for (let ad of data) {
                        ad.description = ad.description.substring(0, 15) + "...";
                    }
                    ctx.ads = data;
                    let partialsObject = getCommonElements(ctx);
                    partialsObject["content"] = './temp/home/index.hbs';

                    ctx.loadPartials(partialsObject).then(function () {
                        this.partial('./temp/common/main.hbs');
                    })
                });
            }).catch(notifications.handleError)
        }

        function displayLogin(ctx) {
            let partialsObject = getCommonElements(ctx);
            partialsObject["loginForm"] = './temp/login/form.hbs';
            partialsObject["content"] = './temp/login/index.hbs';
            ctx.loadPartials(partialsObject).then(function () {
                this.partial('./temp/common/main.hbs');
            });
        }

        function handleLogin(ctx) {
            let username = ctx.params.username;
            let password = ctx.params.passwd;

            auth.login(username, password).then(function (userInfo) {
                if (userInfo.isBlocked === 'true') {
                    notifications.showInfo('You are blocked');
                    ctx.redirect('#/home');
                    return;
                }
                auth.saveSession(userInfo);
                auth.getUserInfo(sessionStorage.getItem('username')).then(function (data) {
                    if (data[0].userRole) {
                        sessionStorage.setItem('userRole', data[0].userRole)
                    }

                    notifications.showInfo('Login successful.');
                    ctx.redirect("#/home");
                });
            }).catch(notifications.handleError);
        }

        function displayRegister(ctx) {
            let partialsObject = getCommonElements(ctx);
            partialsObject["regForm"] = './temp/registration/form.hbs';
            partialsObject["content"] = './temp/registration/index.hbs';

            ctx.loadPartials(partialsObject).then(function () {
                this.partial('./temp/common/main.hbs');
            })
        }

        function handleRegister(ctx) {
            let username = ctx.params.username;
            let password = ctx.params.passwd;
            let confirmPassword = ctx.params.confirmPasswd;
            let email = ctx.params.email;
            let fName = ctx.params.firstName;
            let lName = ctx.params.lastName;
            let phone = ctx.params.phone;
            let avatar = ctx.params.avatar;
            if (!avatar) {
                avatar = 'https://s3.amazonaws.com/wll-community-production/images/no-avatar.png';
            }

            if (password !== confirmPassword) {
                notifications.showError("Passwords do not match.");
                return;
            }

            if (checkUserNameAndPassword(username, password)) {
                auth.register(username, password, avatar, email, phone, fName, lName).then(function (userInfo) {
                    notifications.showInfo('User registration successful.');
                    auth.saveSession(userInfo);
                    ctx.redirect("#/home");
                }).catch(notifications.handleError);
            } else {
                notifications.showError('Invalid username/password.');
            }
        }

        function handleLogout(ctx) {
            auth.logout().then(function () {
                sessionStorage.clear();
                auth.loginAsStupedUser().then(function (data) {
                    auth.saveSession(data);
                    notifications.showInfo('Logout successful.');
                    ctx.redirect("#/home");
                })
            }).catch(notifications.handleError);
        }

        function displayUserProfile(ctx) {
            let username = ctx.params.username;
            if (auth.isAuthed()) {
                ctx.loggedUsername = sessionStorage.getItem('username');
            }
            auth.getUserInfo(username).then(function (data) {
                if (data[0]._id === sessionStorage.getItem('id')) {
                    ctx.isOwner = true;
                }
                ctx.data = data[0];
                ctx.userRole = sessionStorage.getItem('userRole');

                let partialsObject = getCommonElements(ctx);
                partialsObject["content"] = './temp/profile/index.hbs';
                ctx.loadPartials(partialsObject).then(function () {
                    this.partial('./temp/common/main.hbs');
                })
            })
        }

        function displayEditUser(ctx) {
            if (!auth.isAuthed()) {
                ctx.redirect("#/home");
                return;
            }

            let username = ctx.params.username;
            ctx.loggedUsername = sessionStorage.getItem('username');

            auth.getUserInfo(username).then(function (data) {
                if (data[0]._id !== sessionStorage.getItem('id') && sessionStorage.getItem('userRole') !== 'admin') {
                    ctx.redirect('#/home');
                    return;
                }
                if (sessionStorage.getItem('userRole')) {
                    ctx.userRole = true;
                }
                ctx.data = data[0];

                let partialsObject = getCommonElements(ctx);
                partialsObject["editForm"] = './temp/profile/edit/form.hbs';
                partialsObject["content"] = './temp/profile/edit/index.hbs';

                ctx.loadPartials(partialsObject).then(function () {
                    this.partial('./temp/common/main.hbs');
                })
            })
        }

        function handleEditUser(ctx) {
            let avatar = ctx.params.avatar;
            let fName = ctx.params.firstName;
            let lName = ctx.params.lastName;
            let phone = ctx.params.phone;

            auth.getUserInfo(ctx.params.username).then(function (data) {
                let points = data[0].points;

                if (ctx.params.points) {
                    points = ctx.params.points;
                }

                auth.editUser(data[0]._id, data[0].username, avatar, data[0].email, phone, fName, lName, points, data[0].userRole).then(function (userInfo) {
                    notifications.showInfo('Successfully edited.');
                    if (sessionStorage.getItem('userRole') !== 'admin') {
                        auth.saveSession(userInfo);
                    }
                    ctx.redirect(`#/user/details/${data[0].username}`);
                }).catch(notifications.handleError)
            }).catch(notifications.handleError);
        }

        function displayCreateAd(ctx) {
            if (!auth.isAuthed()) {
                ctx.redirect("#/home");
                return;
            }
            brandService.getAllBrands().then(function (data) {
                ctx.category = data;
                let partialsObject = getCommonElements(ctx);
                partialsObject["createForm"] = './temp/ads/create/form.hbs';
                partialsObject["content"] = './temp/ads/create/index.hbs';

                ctx.loadPartials(partialsObject).then(function () {
                    this.partial('./temp/common/main.hbs');
                })
            });
        }

        function handleCreateAd(ctx) {
            let title = ctx.params.title;
            let description = ctx.params.description;
            let brand = $("#brand").find(":selected").text();
            let model = $("#model").find(":selected").text();
            let city = $("#city").find(":selected").text();
            let mileage = parseInt(ctx.params.mileage);
            let price = parseFloat(ctx.params.price);
            let images = ctx.params.images;
            if (!images) {
                images = "https://www.vipspatel.com/wp-content/uploads/2017/04/no_image_available_300x300.jpg";
            }

            if (auth.isAuthed()) {
                ctx.loggedUsername = sessionStorage.getItem('username');
            }
            let author = ctx.loggedUsername;
            let promoted = false;
            let publishedDate = new Date();

            adsService.createAd(title, description, brand, model, city, mileage, price, images, author, promoted, publishedDate).then(function () {
                ctx.redirect("#/home");
            })
        }

        function displayDetailsAd(context) {
            if (auth.isAuthed()) {
                context.loggedUsername = sessionStorage.getItem('username');
            }
            let adId = context.params.id;

            adsService.loadAdDetails(adId)
                .then(function (adInfo) {
                    context.id = adId;
                    context.title = adInfo.title;
                    context.description = adInfo.description;
                    context.publishedDate = calcTime(adInfo.publishedDate);
                    context.author = adInfo.author;
                    context.brand = adInfo.brand;
                    context.model = adInfo.model;
                    context.city = adInfo.city;
                    context.mileage = parseInt(adInfo.mileage);
                    context.price = parseFloat(adInfo.price);
                    context.images = adInfo.images;

                    if (context.author === context.loggedUsername ||
                        sessionStorage.getItem('userRole')) {
                        context.isAuthor = true;
                    }
                    adsService.getAdComments(adId)
                        .then(function (comments) {
                            context.comments = comments;
                            for (let comment of context.comments) {
                                if (sessionStorage.getItem('username') === comment.author
                                    || sessionStorage.getItem('userRole') === 'admin') {
                                    comment.isOwner = true;
                                }
                            }
                            brandService.getAllBrands().then(function (data) {
                                context.category = data;

                                let partialsObject = getCommonElements(context);
                                partialsObject["content"] = './temp/ads/details/index.hbs';
                                partialsObject["comments"] = './temp/ads/details/comments/index.hbs';
                                partialsObject["form"] = './temp/ads/details/comments/form.hbs';
                                context.loadPartials(partialsObject)
                                    .then(function () {
                                        this.partial('./temp/common/main.hbs');
                                    });
                            })
                        })
                }).catch(notifications.handleError);
        }

        function displayEditAd(ctx) {
            let adId = ctx.params.id.substr(1);

            adsService.loadAdDetails(adId)
                .then(function (adInfo) {
                    ctx.id = adId;
                    ctx.title = adInfo.title;
                    ctx.description = adInfo.description;
                    ctx.publishedDate = calcTime(adInfo.publishedDate);
                    ctx.author = adInfo.author;
                    ctx.brand = adInfo.brand;
                    ctx.model = adInfo.model;
                    ctx.city = adInfo.city;
                    ctx.mileage = parseInt(adInfo.mileage);
                    ctx.price = parseFloat(adInfo.price);
                    ctx.images = adInfo.images;
                    ctx.promoted = adInfo.promoted;
                    console.log(ctx.promoted);


                    let partialsObject = getCommonElements(ctx);
                    partialsObject["editForm"] = './temp/ads/edit/form.hbs';
                    partialsObject["content"] = './temp/ads/edit/index.hbs';

                    ctx.loadPartials(partialsObject).then(function () {
                        this.partial('./temp/common/main.hbs');
                    });
                });
        }

        function handleEditAd(ctx) {
            let adId = ctx.params.id.substr(1);
            let title = ctx.params.title;
            let description = ctx.params.description;
            let brand = $("#brand").find(":selected").text();
            let model = $("#model").find(":selected").text();
            let city = $("#city").find(":selected").text();
            let mileage = parseInt(ctx.params.mileage);
            let price = parseFloat(ctx.params.price);
            let publishedDate = new Date();

            let images = ctx.params.images;

            adsService.loadAdDetails(adId).then(function (adInfo) {
                ctx.promoted = adInfo.promoted;
            });
            let promoted = ctx.promoted;
            adsService.loadAdDetails(adId)
                .then(function (adInfo) {
                    if (adInfo.promoted) {
                        ctx.promoted = true;
                    } else {
                        ctx.promoted = false;
                    }

                    if (auth.isAuthed()) {
                        ctx.loggedUsername = sessionStorage.getItem('username');
                    }

                    let author = ctx.loggedUsername;

                    adsService.edit(adId, title, description, brand, model, city, mileage, price, images, publishedDate, author, promoted)
                        .then(function (adInfo) {
                            notifications.showInfo('Ad is updated');
                            ctx.redirect(`#/ads/details/${adId}`);
                            adsService.edit(adId, title, description, brand, model, city, mileage, price, images, publishedDate, author, ctx.promoted)
                                .then(function (adInfo) {
                                    notifications.showInfo('Ad is updated');
                                    ctx.redirect(`#/ads/details/${adId}`);
                                });
                        }).catch(auth.handleError);
                })
        }

        function publishAdComment(ctx) {
            let adId = ctx.params.id.substr(1);

            adsService.loadAdDetails(adId)
                .then(function (adInfo) {
                    ctx.id = adId;

                    let partialsObject = getCommonElements(ctx);
                    partialsObject["commentForm"] = './temp/ads/comments/form.hbs';
                    partialsObject["content"] = './temp/ads/comments/index.hbs';

                    ctx.loadPartials(partialsObject).then(function () {
                        this.partial('./temp/common/main.hbs');
                    });
                });
        }

        function displayMessages(ctx) {
            if (!auth.isAuthed()) {
                ctx.redirect('#/home');
                return;
            }

            let allMessages = [];
            msgService.getSentMessages().then(function (data) {
                for (let message of data) {
                    if (message.title) {
                        message['time'] = calcTime(message._kmd.ect);
                        allMessages.push(message);
                    }
                }

                msgService.getReceivedMessages().then(function (data) {
                    for (let message of data) {
                        if (message.title) {
                            message['time'] = calcTime(message._kmd.ect);
                            allMessages.push(message);
                        }
                    }

                    allMessages = allMessages.sort((a, b) => {
                        if (a._kmd.ect > b._kmd.ect) {
                            return -1;
                        } else {
                            return 1;
                        }
                    });

                    ctx.data = allMessages;

                    let partialsObject = getCommonElements(ctx);
                    partialsObject["content"] = './temp/messages/inbox/index.hbs';
                    partialsObject["message"] = './temp/messages/inbox/message.hbs';

                    ctx.loadPartials(partialsObject).then(function () {
                        this.partial('./temp/common/main.hbs');
                    })
                });
            });
        }

        function displayMessageThread(ctx) {
            let id = ctx.params.id;

            brandService.getAllBrands().then(function (brandInfo) {
                ctx.category = brandInfo;
                msgService.getSingleMessage(id).then(function (data) {
                    data[0]['time'] = calcTime(data[0]._kmd.ect);
                    if (data[0].sender === sessionStorage.getItem('username')) {
                        data[0].style = 'right';
                        data[0].avatar = sessionStorage.getItem('avatar')
                    } else {
                        data[0].style = 'left';
                        auth.getUserInfo(data[0].sender).then(function (userInfo) {
                            data[0].avatar = userInfo.avatar
                        })
                    }
                    ctx.data = data[0];

                    //TODO Avatar promise resolves later
                    msgService.findAnswer(id).then(function (answer) {

                        for (let message of answer) {
                            if (message.sender === sessionStorage.getItem('username')) {
                                message.avatar = sessionStorage.getItem('avatar');
                                message.style = 'right';
                            } else {
                                console.log(2225);
                                let username = message.sender;
                                auth.getUserInfo(username).then(function (userInfo) {
                                    message['avatar'] = userInfo[0].avatar;
                                    message.style = 'left';
                                });
                            }
                            message['time'] = calcTime(message._kmd.ect);
                            ctx.answer = answer;
                            console.log(ctx.answer);
                        }


                        console.log(111);
                        let partialsObject = getCommonElements(ctx);
                        partialsObject["content"] = './temp/messages/thread/index.hbs';
                        partialsObject["form"] = './temp/messages/thread/form.hbs';

                        ctx.loadPartials(partialsObject).then(function () {
                            this.partial('./temp/common/main.hbs');
                        })
                    })
                })
            })
        }

        function displaySendMsg(ctx) {
            ctx.recipient = ctx.params.username;

            let partialsObject = getCommonElements(ctx);
            partialsObject["content"] = './temp/messages/send/index.hbs';
            partialsObject["form"] = './temp/messages/send/form.hbs';

            ctx.loadPartials(partialsObject).then(function () {
                this.partial('./temp/common/main.hbs');
            })
        }

        function handleNewMessageThread(ctx) {
            let recipient = ctx.params.username;
            let sender = sessionStorage.getItem('username');
            let text = ctx.params.description;
            let title = ctx.params.title;

            msgService.createNewMessageThread(recipient, sender, title, text).then(function () {
                notifications.showInfo('Message successfully sent.');
                ctx.redirect('#/user/messages');
            }).catch(notifications.handleError)
        }

        function handleSendMessageInThread(ctx) {
            let sender = sessionStorage.getItem('username');
            let answer = ctx.params.id;
            let text = ctx.params.msgText;
            let recipient = ctx.params.recipient;

            msgService.sendMsg(answer, sender, recipient, text).then(function () {
                ctx.redirect(`#/user/message/${answer}`);
            })
        }

        function displaySearch(ctx) {
            brandService.getAllBrands().then(function (categories) {
                ctx.category = categories;
                adsService.getAds().then(function (data) {
                    let searchQuery = ctx.params.query.toLowerCase();
                    data = data.filter(ad => ad.title.toLowerCase().indexOf(searchQuery) !== -1);
                    console.log(data);

                    for (let ad of data) {
                        ad.description = ad.description.substring(0, 15) + "...";
                    }

                    ctx.ads = data;
                    let partialsObject = getCommonElements(ctx);
                    partialsObject["content"] = './temp/home/index.hbs';

                    ctx.loadPartials(partialsObject).then(function () {
                        this.partial('./temp/common/main.hbs');
                    })
                });
            }).catch(notifications.handleError)
        }

        function checkUserNameAndPassword(username, password) {
            let usernameRegex = /[A-z]{3}/g;
            let passRegex = /[A-z\d]{6}/g;

            return (usernameRegex.test(username) && passRegex.test(password));
        }

        function getCommonElements(ctx) {
            if (auth.isAuthed()) {
                ctx.loggedUsername = sessionStorage.getItem('username');
            }

            return {
                'header': './temp/common/header.hbs',
                'footer': './temp/common/footer.hbs',
                'leftColumn': './temp/common/leftColumn.hbs'
            }

        }

        function stupedUser(ctx) {
            auth.loginAsStupedUser(1, 2).then(function (data) {
                sessionStorage.setItem('authtoken', data._kmd.authtoken);
            });
        }


        function calcTime(dateIsoFormat) {
            let diff = new Date - (new Date(dateIsoFormat));
            diff = Math.floor(diff / 60000);
            if (diff < 1) return 'less than a minute';
            if (diff < 60) return diff + ' minute' + pluralize(diff);
            diff = Math.floor(diff / 60);
            if (diff < 24) return diff + ' hour' + pluralize(diff);
            diff = Math.floor(diff / 24);
            if (diff < 30) return diff + ' day' + pluralize(diff);
            diff = Math.floor(diff / 30);
            if (diff < 12) return diff + ' month' + pluralize(diff);
            diff = Math.floor(diff / 12);
            return diff + ' year' + pluralize(diff);

            function pluralize(value) {
                if (value !== 1) return 's';
                else return '';
            }
        }
    });

    function start() {
        auth.loginAsStupedUser().then(function (data) {
            auth.saveSession(data);
            app.run();
        })
    }

    start();
});
