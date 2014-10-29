Vagrant.configure("2") do |config|

  config.vm.box = "ubuntu/trusty64"

  config.vm.network "forwarded_port", guest: 80, host: 8080, auto_correct: true

  config.vm.synced_folder "./", "/home/vagrant"

  config.vm.provider "virtualbox" do |v|
    v.customize ["modifyvm", :id, "--memory", "1024"]
  end

  config.vm.provision :shell, path: "provision/bootstrap.sh"

end