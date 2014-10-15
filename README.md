## Apicolat application

### Run the docker image

    # Run the image
    sudo docker run --rm --name="apicolat" -p 8888:8888 -p 19000:19000 -p 19001:19001 -it jmorales/apicolat


### Creating docker image

    # Build a new image
    sudo docker build -t "jmorales/apicolat" . 
    # Save the image in a tar
	sudo docker save jmorales/apicolat > dk.apicolat.latest.tar
